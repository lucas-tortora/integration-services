import {
  AccessRights,
  AuthorizeSubscriptionResponse,
  ChannelClient,
  CreateChannelResponse,
  RequestSubscriptionResponse
} from '..';
import { adminUser, apiConfig, normalUser, testChannel, testChannelWrite } from './test.data';
import { ClientConfig } from '../models/clientConfig';
import { ApiVersion } from '../models/apiVersion';

// 60 second timeout since tangle might be slow
jest.setTimeout(60000);

describe('test channel client', () => {
  let channelClient: ChannelClient;
  let { apiVersion, auditTrailUrl, isGatewayUrl, ssiBridgeUrl } = apiConfig;
  if (isGatewayUrl) {
    ssiBridgeUrl = `${isGatewayUrl}/api/${apiVersion}`;
    auditTrailUrl = `${isGatewayUrl}/api/${apiVersion}`;
  } else {
    ssiBridgeUrl = `${ssiBridgeUrl}/api/${apiVersion}`;
    auditTrailUrl = `${auditTrailUrl}/api/${apiVersion}`;
  }
  const globalTestChannel = testChannel;
  const globalTestChannelWrite = testChannelWrite;
  let createdTestChannel: CreateChannelResponse;

  console.log(
    'PLEASE only execute the tests with the ssi-bridge and audit-trail configured to a devnet node to not flood the mainnet with test data'
  );
  beforeEach(() => {
    channelClient = new ChannelClient(apiConfig);
  });
  describe('test authentication', () => {
    it('should have expected default config', async () => {
      const config: ClientConfig = {
        apiVersion: ApiVersion.v01
      };
      const tmpClient = new ChannelClient(config);
      expect(tmpClient.useGatewayUrl).toBe(true);
      expect(tmpClient.isGatewayUrl).toBe('/api/v0.1');
    });
    it('should authenticate user', async () => {
      jest.spyOn(channelClient, 'get');
      jest.spyOn(channelClient, 'getHexEncodedKey');
      jest.spyOn(channelClient, 'signNonce');
      jest.spyOn(channelClient, 'post');
      await channelClient.authenticate(adminUser.id, adminUser.secretKey);

      expect(channelClient.get).toHaveBeenCalledWith(
        `${ssiBridgeUrl}/authentication/prove-ownership/${adminUser.id}`
      );
      expect(channelClient.getHexEncodedKey).toHaveBeenCalledWith(adminUser.secretKey);
      expect(channelClient.jwtToken).toBeDefined();
      expect(channelClient.signNonce).toHaveBeenCalled();
      expect(channelClient.post).toHaveBeenCalledWith(
        `${ssiBridgeUrl}/authentication/prove-ownership/${adminUser.id}`,
        expect.objectContaining({ signedNonce: expect.any(String) })
      );
    });
    it('should not authenticate user since secret key is wrong', async () => {
      jest.spyOn(channelClient, 'get');
      jest.spyOn(channelClient, 'getHexEncodedKey');
      jest.spyOn(channelClient, 'signNonce');
      jest.spyOn(channelClient, 'post');
      try {
        await channelClient.authenticate(
          adminUser.id,
          'Hn5Sw3yuLVA8HSbf42sqYwa3A9Bd5YfxGRqLMA3L2w8L'
        );
      } catch (e: any) {
        expect(e.response.data).toMatchObject({ error: 'could not prove the ownership' });
      }

      expect(channelClient.get).toHaveBeenCalledWith(
        `${ssiBridgeUrl}/authentication/prove-ownership/${adminUser.id}`
      );
      expect(channelClient.getHexEncodedKey).toHaveBeenCalledWith(
        'Hn5Sw3yuLVA8HSbf42sqYwa3A9Bd5YfxGRqLMA3L2w8L'
      );
      expect(channelClient.jwtToken).toBeUndefined();
      expect(channelClient.signNonce).toHaveBeenCalled();
      expect(channelClient.post).toHaveBeenCalledWith(
        `${ssiBridgeUrl}/authentication/prove-ownership/${adminUser.id}`,
        expect.objectContaining({ signedNonce: expect.any(String) })
      );
    });
  });

  // ***** CHANNEL CREATION *****
  describe('test channel creation', () => {
    beforeEach(async () => {
      try {
        await channelClient.authenticate(adminUser.id, adminUser.secretKey);
      } catch (e: any) {
        console.log('error: ', e);
        expect(e).toBeUndefined();
      }
    });
    it('should create a new channel', async () => {
      jest.spyOn(channelClient, 'create');
      jest.spyOn(channelClient, 'post');
      try {
        createdTestChannel = await channelClient.create(globalTestChannel);
        expect(createdTestChannel).toMatchObject({
          seed: globalTestChannel.seed,
          channelAddress: expect.any(String)
        } as CreateChannelResponse);
      } catch (e: any) {
        console.log('error: ', e);
        expect(e).toBeUndefined();
      }

      expect(channelClient.post).toHaveBeenCalledWith(
        `${auditTrailUrl}/channels/create`,
        testChannel
      );
    });
  });

  // ***** CHANNEL WRITE *****
  describe('test channel write', () => {
    beforeEach(async () => {
      try {
        await channelClient.authenticate(adminUser.id, adminUser.secretKey);
      } catch (e: any) {
        console.log('error: ', e);
        expect(e).toBeUndefined();
      }
    });

    it('should write to channel as author', async () => {
      jest.spyOn(channelClient, 'write');
      jest.spyOn(channelClient, 'post');
      try {
        const response = await channelClient.write(
          createdTestChannel.channelAddress,
          globalTestChannelWrite
        );
        const { created, type, metadata, publicPayload, payload } = globalTestChannelWrite;
        expect(response).toMatchObject({
          link: expect.any(String),
          messageId: expect.any(String),
          log: {
            created,
            type,
            metadata,
            publicPayload,
            payload
          }
        });
      } catch (e: any) {
        console.log('error: ', e);
        expect(e).toBeUndefined();
      }
      expect(channelClient.post).toHaveBeenCalledWith(
        `${auditTrailUrl}/channels/logs/${createdTestChannel.channelAddress}`,
        globalTestChannelWrite
      );
    });

    it('should not be able to write to chanel since user is not subscribed', async () => {
      jest.spyOn(channelClient, 'write');
      jest.spyOn(channelClient, 'post');
      try {
        await channelClient.authenticate(normalUser.id, normalUser.secretKey);

        await channelClient.write(createdTestChannel.channelAddress, globalTestChannelWrite);
      } catch (e: any) {
        expect(e.response.data).toMatchObject({ error: 'could not add the logs' });
      }
    });

    it('should subscribe to channel', async () => {
      jest.spyOn(channelClient, 'authorizeSubscription');
      try {
        await channelClient.authenticate(normalUser.id, normalUser.secretKey);
        jest.spyOn(channelClient, 'post');
        const requestResponse = await channelClient.requestSubscription(
          createdTestChannel.channelAddress,
          {
            accessRights: AccessRights.Read
          }
        );
        await channelClient.authenticate(adminUser.id, adminUser.secretKey);
        const authorizationResponse = await channelClient.authorizeSubscription(
          createdTestChannel.channelAddress,
          { subscriptionLink: requestResponse.subscriptionLink }
        );
        expect(requestResponse).toMatchObject({
          seed: expect.any(String),
          subscriptionLink: expect.any(String)
        } as RequestSubscriptionResponse);
        expect(authorizationResponse).toMatchObject({
          keyloadLink: expect.any(String)
        } as AuthorizeSubscriptionResponse);
        expect(channelClient.post).toHaveBeenNthCalledWith(
          1,
          `${auditTrailUrl}/subscriptions/request/${createdTestChannel.channelAddress}`,
          { accessRights: AccessRights.Read }
        );
        expect(channelClient.post).toHaveBeenNthCalledWith(
          3,
          `${auditTrailUrl}/subscriptions/authorize/${createdTestChannel.channelAddress}`,
          { subscriptionLink: requestResponse.subscriptionLink }
        );
      } catch (e: any) {
        console.log('error: ', e);
        expect(e).toBeUndefined();
      }
    });

    it('should read channel', async () => {
      jest.spyOn(channelClient, 'read');
      try {
        await channelClient.authenticate(normalUser.id, normalUser.secretKey);
        // start spying after authentication to not catch the authentication get request
        jest.spyOn(channelClient, 'get');

        const response = await channelClient.read(createdTestChannel.channelAddress);
        expect(response).toEqual([]);
      } catch (e: any) {
        console.log('error: ', e);
        expect(e).toBeUndefined();
      }
    });

    it('should not be able to write to channel since only read access rights are granted', async () => {
      try {
        await channelClient.authenticate(normalUser.id, normalUser.secretKey);
        // start spying after authentication to not catch the authentication post request
        jest.spyOn(channelClient, 'post');
        await channelClient.write(createdTestChannel.channelAddress, { payload: 'test' });
      } catch (e: any) {
        expect(e.response.data).toMatchObject({ error: 'could not add the logs' });
      }
    });
  });

  // ***** CHANNEL SEARCH *****
  describe('test channel search', () => {
    beforeEach(async () => {
      try {
        await channelClient.authenticate(adminUser.id, adminUser.secretKey);
      } catch (e: any) {
        console.log('error: ', e);
        expect(e).toBeUndefined();
      }
    });

    it('should find created channel', async () => {
      jest.spyOn(channelClient, 'search');
      jest.spyOn(channelClient, 'get');
      try {
        const response = await channelClient.search({
          name: globalTestChannel.name,
          authorId: adminUser.id,
          ascending: true,
          index: 0
        });
        expect(response.length).toBe(1);
        expect(response[0]).toMatchObject({
          created: expect.any(String),
          authorId: adminUser.id,
          name: globalTestChannel.name,
          description: globalTestChannel.description,
          subscriberIds: expect.any(Array),
          topics: expect.arrayContaining(globalTestChannel.topics),
          channelAddress: expect.any(String)
        });
      } catch (e: any) {
        console.log('error: ', e);
        expect(e).toBeUndefined();
      }

      expect(channelClient.get).toHaveBeenCalledWith(`${auditTrailUrl}/channel-info/search`, {
        'api-key': apiConfig.apiKey,
        name: globalTestChannel.name,
        'author-id': adminUser.id,
        created: undefined,
        limit: undefined,
        asc: true,
        index: 0
      });
    });
  });
});