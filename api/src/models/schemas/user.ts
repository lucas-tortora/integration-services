import { Type } from '@sinclair/typebox';
import { UserType } from '../types/user';
import { VerifiableCredentialSchema } from './identity';

export const LocationSchema = Type.Object({
	latitude: Type.Number(),
	longitude: Type.Number()
});

export const UserWithoutIdFields = {
	type: Type.Union([Type.Enum(UserType), Type.String({ minLength: 3 })]),
	username: Type.Optional(Type.String({ minLength: 3 })),
	registrationDate: Type.Optional(Type.Union([Type.String(), Type.Null()])),
	verifiableCredentials: Type.Optional(Type.Union([Type.Array(VerifiableCredentialSchema), Type.Null()])),
	role: Type.Optional(Type.Union([Type.String(), Type.Null()])),
	claim: Type.Optional(Type.Union([Type.Any(), Type.Null()]))
};

export const UserSchema = Type.Object({
	identityId: Type.String({ minLength: 50, maxLength: 53 }), // did
	publicKey: Type.String({ minLength: 10 }),
	...UserWithoutIdFields
});
