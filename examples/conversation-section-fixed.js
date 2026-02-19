import { Div, H2, Header, UseParent } from "@base-framework/atoms";
import { Jot } from "@base-framework/base";
import { ConversationModel } from "../../../../models/conversation-model.js";
import { ConversationList } from "./conversation-list.js";
import { ThreadComposer } from "./thread-composer.js";

/**
 * Composer
 *
 * @param {object} param0
 * @returns {object}
 */
const Composer = ({ client }) => (
	new ThreadComposer({
		placeholder: "Add a comment...",
		client
	})
);

/**
 * HeaderContainer
 *
 * @returns {object}
 */
const HeaderContainer = () => (
	Header({ class: "flex flex-col gap-y-2 p-6 bg-background/80 backdrop-blur-md sticky top-0 z-10" }, [
		H2({ class: "text-lg text-muted-foreground" }, "Conversation")
	])
);

/**
 * ConversationSection
 *
 * Displays conversation history and composer with real-time sync.
 *
 * @param {object} props
 * @param {object} props.client
 * @returns {object}
 */
export const ConversationSection = Jot(
{
	/**
	 * Set up the data model.
	 *
	 * @returns {object}
	 */
	setData()
	{
		return new ConversationModel({
			// @ts-ignore
			clientId: this.client.id,
			orderBy: {
				createdAt: 'desc'
			}
		});
	},

	/**
	 * Set up the SSE connection for conversation updates.
	 *
	 * @returns {void}
	 */
	setupSync()
	{
		// @ts-ignore
		this.eventSource = this.data.xhr.sync({}, (response) =>
		{
			if (!response || !response.merge)
			{
				return;
			}

			// @ts-ignore
			if (this.list && response.merge.length > 0)
			{
				/**
				 * We need to check if the user is at the bottom before mingling new messages.
				 */
				// @ts-ignore
				const isAtBottom = this.isAtBottom();

				// @ts-ignore
				this.list.mingle(response.merge);

				// If at bottom, scroll to show new messages
				// @ts-ignore
				if (isAtBottom)
				{
					// Wait for batched publish to complete, then scroll
					// @ts-ignore
					this.data.eventSub.onFlush(() =>
					{
						requestAnimationFrame(() =>
						{
							// @ts-ignore
							this.panel.scrollTop = this.panel.scrollHeight;
						});
					});
				}
			}

			// Handle deletions if needed
			// @ts-ignore
			if (this.list && response.deleted && response.deleted.length > 0)
			{
				response.deleted.forEach(id =>
				{
					// @ts-ignore
					this.list.remove(id);
				});
			}
		});
	},

	/**
	 * Scroll the message panel to the bottom.
	 *
	 * @returns {void}
	 */
	scrollToBottom()
	{
		// @ts-ignore
		this.panel.scrollTo({ top: this.panel.scrollHeight, behavior: 'smooth' });
	},

	/**
	 * Check if the message panel is scrolled to the bottom.
	 *
	 * @returns {boolean}
	 */
	isAtBottom()
	{
		const BOTTOM_GRACE = 60;
		// @ts-ignore
		return this.panel.scrollHeight - this.panel.scrollTop - this.panel.clientHeight <= BOTTOM_GRACE;
	},

	/**
	 * Start SSE sync after component is set up.
	 *
	 * @returns {void}
	 */
	after()
	{
		// @ts-ignore
		this.setupSync();
	},

	/**
	 * Clean up the SSE connection.
	 *
	 * @returns {void}
	 */
	beforeDestroy()
	{
		// @ts-ignore
		if (this.eventSource)
		{
			// @ts-ignore
			this.eventSource.close();
			// @ts-ignore
			this.eventSource = null;
		}
	},

	/**
	 * Render the conversation section.
	 *
	 * @returns {object}
	 */
	render()
	{
		return Div({
			class: "flex flex-auto flex-col max-h-screen gap-y-4 p-0 overflow-y-auto w-full max-w-full sticky top-0",
		}, [
			HeaderContainer(),
			Div({ class: "flex-1 gap-y-2" }, [
				UseParent(({ panel }) => (
					ConversationList({
						// @ts-ignore
						data: this.data,
						// @ts-ignore
						scrollContainer: panel
					})
				))
			]),
			// @ts-ignore
			Composer({ client: this.client })
		]);
	}
});
