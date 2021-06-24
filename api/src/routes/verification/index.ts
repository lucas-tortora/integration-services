import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { VerifiableCredentialJson } from '../../models/types/identity';
import { VerificationService } from '../../services/verification-service';
import { Config } from '../../models/config';
import { RevokeVerificationBody, TrustedRootBody, VerifyIdentityBody } from '../../models/types/request-bodies';
import { AuthenticatedRequest, AuthorizationCheck, Subject } from '../../models/types/verification';
import { User, UserRoles } from '../../models/types/user';
import * as KeyCollectionLinksDb from '../../database/verifiable-credentials';
import { AuthorizationService } from '../../services/authorization-service';
import { VerifiableCredentialPersistence } from '../../models/types/key-collection';
import { logger } from '../../utils/logger';

export class VerificationRoutes {
	constructor(
		private readonly verificationService: VerificationService,
		private readonly authorizationService: AuthorizationService,
		private readonly config: Config
	) {}

	createVerifiableCredential = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
		try {
			const verifyIdentityBody = req.body as VerifyIdentityBody;
			const { initiatorVC, subject } = verifyIdentityBody;
			const requestUser = req.user;

			if (!subject) {
				throw new Error('no valid subject!');
			}

			if (!requestUser.identityId && !initiatorVC?.credentialSubject?.id) {
				throw new Error('no initiator id could be found!');
			}

			const { isAuthorized, error } = await this.isAuthorizedToVerify(subject, initiatorVC, requestUser);
			if (!isAuthorized) {
				throw error;
			}

			const vc: VerifiableCredentialJson = await this.verificationService.verifyIdentity(
				subject,
				this.config.serverIdentityId,
				initiatorVC?.credentialSubject?.id || requestUser.identityId
			);

			res.status(StatusCodes.OK).send(vc);
		} catch (error) {
			logger.log({ level: 'error', message: error });
			next(new Error('could not create the verifiable credential'));
		}
	};

	checkVerifiableCredential = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const vcBody = req.body as VerifiableCredentialJson;
			const isVerified = await this.verificationService.checkVerifiableCredential(vcBody);
			res.status(StatusCodes.OK).send({ isVerified });
		} catch (error) {
			logger.log({ level: 'error', message: error });
			next(new Error('could not check the verifiable credential'));
		}
	};

	revokeVerifiableCredential = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
		try {
			const revokeBody = req.body as RevokeVerificationBody;
			const requestUser = req.user;

			const vcp = await KeyCollectionLinksDb.getVerifiableCredential(revokeBody.signatureValue);
			if (!vcp) {
				throw new Error('no vc found to revoke the verification!');
			}
			const { isAuthorized, error } = await this.isAuthorizedToRevoke(vcp, requestUser);
			if (!isAuthorized) {
				throw error;
			}

			await this.verificationService.revokeVerifiableCredential(vcp, this.config.serverIdentityId);

			res.sendStatus(StatusCodes.OK);
		} catch (error) {
			logger.log({ level: 'error', message: error });
			next(new Error('could not revoke the verifiable credential'));
		}
	};

	getLatestDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const decodeParam = (param: string): string | undefined => (param ? decodeURI(param) : undefined);
			const did = req.params && decodeParam(<string>req.params['identityId']);

			if (!did) {
				res.sendStatus(StatusCodes.BAD_REQUEST);
				return;
			}

			const doc = await this.verificationService.getLatestDocument(did);

			res.status(StatusCodes.OK).send(doc);
		} catch (error) {
			logger.log({ level: 'error', message: error });
			next(new Error('could not get the latest document'));
		}
	};

	addTrustedRootIdentity = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const { trustedRoot } = req.body as TrustedRootBody;
			if (!this.authorizationService.isAuthorizedAdmin(req.user)) {
				return res.sendStatus(StatusCodes.UNAUTHORIZED);
			}

			await this.verificationService.addTrustedRootId(trustedRoot);
			return res.sendStatus(StatusCodes.OK);
		} catch (error) {
			logger.log({ level: 'error', message: error });
			next(new Error('could not add the trusted root'));
		}
	};

	removeTrustedRootIdentity = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const { trustedRoot } = req.body as TrustedRootBody;
			if (!this.authorizationService.isAuthorizedAdmin(req.user)) {
				return res.sendStatus(StatusCodes.UNAUTHORIZED);
			}

			await this.verificationService.removeTrustedRootId(trustedRoot);
			return res.sendStatus(StatusCodes.OK);
		} catch (error) {
			logger.log({ level: 'error', message: error });
			next(new Error('could not remove the trusted root'));
		}
	};

	getTrustedRootIdentities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const trustedRoots = await this.verificationService.getTrustedRootIds();
			res.status(StatusCodes.OK).send({ trustedRoots });
		} catch (error) {
			logger.log({ level: 'error', message: error });
			next(new Error('could not get the trusted root identities'));
		}
	};

	isAuthorizedToRevoke = async (kci: VerifiableCredentialPersistence, requestUser: User): Promise<AuthorizationCheck> => {
		const isAuthorizedUser = this.authorizationService.isAuthorizedUser(requestUser.identityId, kci.vc.id);
		const isAuthorizedInitiator = this.authorizationService.isAuthorizedUser(requestUser.identityId, kci.initiatorId);
		if (!isAuthorizedUser && !isAuthorizedInitiator) {
			const isAuthorizedAdmin = this.authorizationService.isAuthorizedAdmin(requestUser);
			if (!isAuthorizedAdmin) {
				return { isAuthorized: false, error: new Error('not allowed to revoke credential!') };
			}
		}

		return { isAuthorized: true, error: null };
	};

	isAuthorizedToVerify = async (subject: Subject, initiatorVC: VerifiableCredentialJson, requestUser: User): Promise<AuthorizationCheck> => {
		const isAdmin = requestUser.role === UserRoles.Admin;
		if (!isAdmin) {
			if (!initiatorVC || !initiatorVC.credentialSubject) {
				return { isAuthorized: false, error: new Error('no valid verfiable credential!') };
			}

			if (requestUser.identityId !== initiatorVC.credentialSubject.id || requestUser.identityId !== initiatorVC.id) {
				return { isAuthorized: false, error: new Error('user id of request does not concur with the initiatorVC user id!') };
			}

			if (!this.authorizationService.hasAuthorizedUserType(initiatorVC.credentialSubject.type)) {
				return { isAuthorized: false, error: new Error('initiator is not allowed based on its identity type!') };
			}

			if (!this.authorizationService.hasVerificationCredentialType(initiatorVC.type)) {
				return { isAuthorized: false, error: new Error('initiator is not allowed based on its credential type!') };
			}

			const isInitiatorVerified = await this.verificationService.checkVerifiableCredential(initiatorVC);
			if (!isInitiatorVerified) {
				return { isAuthorized: false, error: new Error('initiatorVC is not verified!') };
			}
		}
		return { isAuthorized: true, error: null };
	};
}
