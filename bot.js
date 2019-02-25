// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');
const fetch = require('node-fetch');

const CONVERSATION_FLOW_PROPERTY = 'conversationFlowProperty';
const SCIENCE_ID = 'scienceId';
const POST_ID = 'postId';

class MyBot {
    constructor(userState, conversationState) {
        this.conversationFlow = conversationState.createProperty(CONVERSATION_FLOW_PROPERTY);
        this.scienceIdProperty = userState.createProperty(SCIENCE_ID);
        this.postIdProperty = userState.createProperty(POST_ID);

        this.conversationState = conversationState;
        this.userState = userState;
    }

    async onTurn(turnContext) {
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        if (turnContext.activity.type === ActivityTypes.Message) {
            let text = turnContext.activity.text.toLowerCase();

            if (text.charAt(0) === '/') {
                let trailedStr = text.substring(1);
                switch (trailedStr) {
                case 'courses':
                    await turnContext.sendActivity('Looking for available courses:');
                    await this.selectScience(turnContext);
                    break;
                default:
                    await turnContext.sendActivity("Can't find any activities under this command");
                    break;
                }
            } else {
                switch (text) {
                case 'hello':
                case 'hi':
                    await turnContext.sendActivity(`You said "${ turnContext.activity.text }"`);
                    break;
                case 'intro':
                case 'help':
                    break;
                default :
                    await turnContext.sendActivity(`This is a simple Welcome Bot sample. You can say 'intro' to
                                                        see the introduction card. If you are running this bot in the Bot
                                                        Framework Emulator, press the 'Start Over' button to simulate user joining a bot or a channel`);
                }
                await this.userState.saveChanges(turnContext);
            }
        } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
            // Send greeting when users are added to the conversation.
            await this.sendWelcomeMessage(turnContext);
        } else {
            // Generic message for all other activities
            await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
    }

    async sendWelcomeMessage(turnContext) {
        if (turnContext.activity.membersAdded.length !== 0) {
            for (let idx in turnContext.activity.membersAdded) {
                if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                    await turnContext.sendActivity('Welcome to Course Bot');
                    await turnContext.sendActivity('To view courses tree type : "/courses"');
                }
            }
        }
    }

    async selectScience(turnContext) {
        let url = 'https://aiguardianswebhost20190219053312.azurewebsites.net/api/services/app/Science/GetSciences';

        const result = async url => {
            try {
                const response = await fetch(url);
                const json = await response.json();
                return json;
            } catch (error) {
                console.log(error);
            }
        };

        let response = await result(url);
        let string = '';

        response.result.forEach(el => {
            string += `${ el.id }. ${ el.scienceName }`;
            string += '\n';
        });

        await turnContext.sendActivity(string);
    }
}

module.exports.MyBot = MyBot;
