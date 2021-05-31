import { ChannelData, ChannelLog } from '../models/types/channel-data';
import streams, { Address, Author, Subscriber } from '../streams-lib/wasm-node/iota_streams_wasm';
import { fromBytes, toBytes } from '../utils/text';

streams.set_panic_hook();

export class StreamsService {
	private readonly node: string;

	constructor(node: string) {
		this.node = node;
	}

	importSubscription = (state: string, isAuthor: boolean, password: string): Author | Subscriber => {
		try {
			const options = new streams.SendOptions(1, true, 1);

			const client = new streams.Client(this.node, options.clone());
			if (isAuthor) {
				return streams.Author.import(client, toBytes(state), password);
			}
			return streams.Subscriber.import(client, toBytes(state), password);
		} catch (error) {
			console.log('Error from streams sdk:', error);
			throw new Error('could not import the subscription object');
		}
	};

	exportSubscription = (subscription: Author | Subscriber, password: string): string => {
		try {
			return fromBytes(subscription.clone().export(password));
		} catch (error) {
			console.log('Error from streams sdk:', error);
			throw new Error('could not export the subscription object');
		}
	};

	create = async (seed?: string): Promise<{ seed: string; channelAddress: string; author: Author }> => {
		try {
			const options = new streams.SendOptions(1, true, 1);
			if (!seed) {
				seed = this.makeSeed(81);
			}
			const author = new streams.Author(this.node, seed, options, false);

			const response = await author.clone().send_announce();
			const ann_link = response.get_link();

			return {
				seed,
				channelAddress: ann_link.to_string(),
				author
			};
		} catch (error) {
			console.log('Error from streams sdk:', error);
			throw new Error('could not create the channel');
		}
	};

	addLogs = async (
		latestLink: string,
		subscription: Author | Subscriber,
		channelLog: ChannelLog
	): Promise<{ link: string; subscription: Author | Subscriber; prevLogs: ChannelData[] }> => {
		try {
			const latestAddress = Address.from_string(latestLink);
			const mPayload = toBytes(JSON.stringify(channelLog));

			let response: any = null;
			const prevLogs = (await this.getLogs(subscription))?.channelData;
			await subscription.clone().sync_state();
			response = await subscription.clone().send_tagged_packet(latestAddress, toBytes(''), mPayload);
			const tag_link = response.get_link();

			return {
				link: tag_link.to_string(),
				prevLogs,
				subscription
			};
		} catch (error) {
			console.log('Error from streams sdk:', error);
			throw new Error('could not add logs to the channel');
		}
	};

	// TODO consider if channel is encrypted or not when getting adding data to channel
	getLogs = async (
		subscription: Author | Subscriber
	): Promise<{ channelData: ChannelData[]; subscription: Author | Subscriber; latestLink: string }> => {
		let foundNewMessage = true;
		let channelData: ChannelData[] = [];
		let latestLink = '';

		while (foundNewMessage) {
			let next_msgs: any = [];

			next_msgs = await subscription.clone().fetch_next_msgs();

			if (next_msgs.length === 0) {
				foundNewMessage = false;
			} else {
				latestLink = next_msgs[next_msgs.length - 1]?.get_link()?.to_string();
			}

			if (next_msgs && next_msgs.length > 0) {
				const cData: ChannelData[] = next_msgs
					.map((userResponse: any) => {
						const link = userResponse?.get_link()?.to_string();
						const message = userResponse.get_message();
						const maskedPayload = message && fromBytes(message.get_masked_payload());
						try {
							const channelData: ChannelData = {
								link,
								channelLog: JSON.parse(maskedPayload)
							};
							return channelData;
						} catch (e) {
							console.log('could not parse maskedPayload: ', maskedPayload);
							return;
						}
					})
					.filter((c: ChannelData | undefined) => c);
				channelData = [...channelData, ...cData];
			}
		}
		console.log('CHANNEL DATA ', channelData);

		return {
			channelData,
			subscription,
			latestLink
		};
	};

	requestSubscription = async (
		announcementLink: string,
		seed?: string
	): Promise<{ seed: string; subscriptionLink: string; subscriber: Subscriber }> => {
		try {
			const annAddress = streams.Address.from_string(announcementLink);
			const options = new streams.SendOptions(1, true, 1);

			if (!seed) {
				seed = this.makeSeed(81);
			}

			const subscriber = new streams.Subscriber(this.node, seed, options);
			let ann_link_copy = annAddress.copy();
			await subscriber.clone().receive_announcement(ann_link_copy);

			ann_link_copy = annAddress.copy();
			const response = await subscriber.clone().send_subscribe(ann_link_copy);
			const sub_link = response.get_link();
			return { seed, subscriptionLink: sub_link.to_string(), subscriber };
		} catch (error) {
			console.log('Error from streams sdk:', error);
			throw new Error('could not request the subscription to the channel');
		}
	};

	authorizeSubscription = async (
		channelAddress: string,
		subscriptionLink: string,
		author: Author
	): Promise<{ keyloadLink: string; author: Author }> => {
		try {
			const announcementAddress = streams.Address.from_string(channelAddress);
			const subscriptionAddress = streams.Address.from_string(subscriptionLink);
			await author.clone().receive_subscribe(subscriptionAddress);

			const response = await author.clone().send_keyload_for_everyone(announcementAddress);
			const keyload_link = response.get_link();
			return { keyloadLink: keyload_link.to_string(), author };
		} catch (error) {
			console.log('Error from streams sdk:', error);
			throw new Error('could not authorize the subscription to the channel');
		}
	};

	makeSeed(size: number) {
		const alphabet = 'abcdefghijklmnopqrstuvwxyz';
		let seed = '';
		for (let i = 9; i < size; i++) {
			seed += alphabet[Math.floor(Math.random() * alphabet.length)];
		}
		return seed;
	}
}