// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, CardFactory } = require('botbuilder');
const { DialogSet, WaterfallDialog, TextPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');
// const { cardFactory } = require('adaptivecards');
// const fetch = require('node-fetch');
const course = require('./course');
const course1 = require('./course1');

const courses = [ course, course1 ];

const DIALOG_STATE_ACCESSOR = 'dialogStateAccessor';
const USER_INFO_ACCESOR = 'userInfoAccesor';
const USER_PROFILE_PROPERTY = 'userProfile';

const USER_INFO_DIALOG = 'userInfoDialog';
const COURSE_PICK_DIALOG = 'coursePickDialog';
const SEARCH_COURSE_DIALOG = 'serachCourseDialog';
const DISPLAY_COURSE_DIALOG = 'displayCourseDialog';

const SERACH_PROMPT = 'serachPrompt';
const LANGUAGE_PROMPT = 'languagePrompt';
const LOCATION_PROMPT = 'locationPrompt';
const SECTION_PROMPT = 'sectionPrompt';
const TOPIC_PROMPT = 'topicPrompt';
const COURSE_PROMPT = 'coursePrompt';
const NAVIGATION_PROMPT = 'navigationPrompt';

const COURSE_INFO_ACCESOR = 'courseInfoAccesor';
const COURSE_STATE_ACCESSOR = 'courseStateAccesor';
const SEARCH_COURSE_ACCESSOR = 'serachCourseAccesor';
const DISPLAY_COURSE_ACCESSOR = 'displayCourseAccesor';

class MyBot {
    constructor(userState, conversationState, cardFactory) {
        this.iterator = 0;
        this.courses = courses;
        this.courseSelect = 0;

        this.dialogStateAccessor = conversationState.createProperty(DIALOG_STATE_ACCESSOR);
        this.courseStateAccessor = conversationState.createProperty(COURSE_STATE_ACCESSOR);
        this.searchCourseAccessor = conversationState.createProperty(SEARCH_COURSE_ACCESSOR);
        this.displayCourseAccessor = conversationState.createProperty(DISPLAY_COURSE_ACCESSOR);

        this.userInfoAccessor = conversationState.createProperty(USER_INFO_ACCESOR);
        this.courseInfoAccessor = conversationState.createProperty(COURSE_INFO_ACCESOR);
        this.userProfile = userState.createProperty(USER_PROFILE_PROPERTY);

        this.conversationState = conversationState;
        this.userState = userState;

        this.userInfoDialog = new DialogSet(this.dialogStateAccessor);
        this.userInfoDialog.add(new ChoicePrompt(LANGUAGE_PROMPT));
        this.userInfoDialog.add(new TextPrompt(LOCATION_PROMPT));

        this.userInfoDialog.add(new WaterfallDialog(USER_INFO_DIALOG, [
            this.promptForLanguage.bind(this),
            this.promptForLocation.bind(this),
            this.endUserFetch.bind(this)
        ]));

        this.coursePickDialog = new DialogSet(this.courseStateAccessor);
        this.coursePickDialog.add(new ChoicePrompt(SECTION_PROMPT));
        this.coursePickDialog.add(new ChoicePrompt(TOPIC_PROMPT));
        this.coursePickDialog.add(new ChoicePrompt(COURSE_PROMPT));

        this.coursePickDialog.add(new WaterfallDialog(COURSE_PICK_DIALOG, [
            this.promptForSection.bind(this),
            this.promptForTopic.bind(this),
            this.choseCourse.bind(this),
            this.summarize.bind(this)
        ]));

        this.searchCoursekDialog = new DialogSet(this.searchCourseAccessor);
        this.searchCoursekDialog.add(new TextPrompt(SERACH_PROMPT));
        this.searchCoursekDialog.add(new ChoicePrompt(COURSE_PROMPT));

        this.searchCoursekDialog.add(new WaterfallDialog(SEARCH_COURSE_DIALOG, [
            this.promptSearch.bind(this),
            this.searchChoseCourse.bind(this),
            this.summarizeSearch.bind(this)
        ]));

        this.displayCourseDialog = new DialogSet(this.displayCourseAccessor);
        this.displayCourseDialog.add(new ChoicePrompt(NAVIGATION_PROMPT));

        this.displayCourseDialog.add(new WaterfallDialog(DISPLAY_COURSE_DIALOG, [
            this.displayCourse.bind(this),
            this.loopCourse.bind(this)
        ]));
    }

    async onTurn(turnContext) {
        switch (turnContext.activity.type) {
        case ActivityTypes.Message:
            const info = await this.userInfoAccessor.get(turnContext, null);
            const userProfile = await this.userProfile.get(turnContext, null);
            const dc = await this.userInfoDialog.createContext(turnContext);
            const cpd = await this.coursePickDialog.createContext(turnContext);
            const cs = await this.searchCoursekDialog.createContext(turnContext);
            const dcrs = await this.displayCourseDialog.createContext(turnContext);

            let check = turnContext.activity.text.toLowerCase();

            if (check === '/main') {
                // await cpd.context.sendActivity('Dialog interupted');
                // await cs.context.sendActivity('Dialog interupted');
                // await dcrs.context.sendActivity('Dialog interupted');
                if (dc.activeDialog) {
                    await dc.context.sendActivity('Dialog interupted');
                }
                if (cpd.activeDialog) {
                    await cpd.context.sendActivity('Dialog interupted');
                }
                if (cs.activeDialog) {
                    await cs.context.sendActivity('Dialog interupted');
                }
                if (dcrs.activeDialog) {
                    await dcrs.context.sendActivity('Dialog interupted');
                }
                dc.cancelAllDialogs();
                cpd.cancelAllDialogs();
                cs.cancelAllDialogs();
                dcrs.cancelAllDialogs();
            }

            if (!dc.activeDialog) {
                // If there is no active dialog, check whether we have a reservation yet.
                if (!info && !userProfile) {
                    // If not, start the dialog.
                    await dc.beginDialog(USER_INFO_DIALOG);
                }
            } else {
                // Continue the dialog.
                const dialogTurnResult = await dc.continueDialog();

                // If the dialog completed this turn, record the reservation info.
                if (dialogTurnResult.status === DialogTurnStatus.complete) {
                    await this.userInfoAccessor.set(
                        turnContext,
                        dialogTurnResult.result);

                    await this.userProfile.set(
                        turnContext,
                        dialogTurnResult.result);

                    // Send a confirmation message to the user.
                    await turnContext.sendActivity(
                        `Your language is ${ dialogTurnResult.result.language } ` +
                        `and location: ${ dialogTurnResult.result.location } `);
                    await turnContext.sendActivity('Now you can test some commands\n' +
                                                    '/main - Stops conversation end return to start\n' +
                                                    '/help - Display help prompt\n' +
                                                    '/courses - Display courses list\n' +
                                                    '/search - Searching for courses\n');
                }
            }

            if (dcrs.activeDialog) {
                const dialogTurnResult = await dcrs.continueDialog();

                if (dialogTurnResult.status === DialogTurnStatus.complete) {
                    turnContext.sendActivity('Course ended, redirecting to main and listening for commands');
                }
            }

            if (cpd.activeDialog) {
                const dialogTurnResult = await cpd.continueDialog();

                if (dialogTurnResult.status === DialogTurnStatus.complete) {
                    await this.courseInfoAccessor.set(
                        turnContext,
                        dialogTurnResult.result);
                    await this.conversationState.saveChanges(turnContext, false);
                    await dcrs.beginDialog(DISPLAY_COURSE_DIALOG);
                }
            }

            if (cs.activeDialog) {
                const dialogTurnResult = await cs.continueDialog();

                if (dialogTurnResult.status === DialogTurnStatus.complete) {
                    await this.searchCourseAccessor.set(
                        turnContext,
                        dialogTurnResult.result);
                    await this.conversationState.saveChanges(turnContext, false);
                    await dcrs.beginDialog(DISPLAY_COURSE_DIALOG);
                }
            }
            let text = turnContext.activity.text.toLowerCase();

            if (text.charAt(0) === '/') {
                let trailedStr = text.substring(1);
                switch (trailedStr) {
                case 'courses':
                    await cpd.beginDialog(COURSE_PICK_DIALOG);
                    break;
                case 'search':
                    await cs.beginDialog(SEARCH_COURSE_DIALOG);
                    break;
                case 'main':
                    break;
                case 'help':
                    await turnContext.sendActivity('Now you can test some commands:\n' +
                        '/main - Stops conversation end return to start\n' +
                        '/help - Display help prompt\n' +
                        '/courses - Display courses list\n' +
                        '/search - Searching for courses\n');
                    break;
                default:
                    await turnContext.sendActivity("Can't find any activities under this command");
                    break;
                }
            }

            // Save the updated dialog state into the conversation state.
            await this.conversationState.saveChanges(turnContext, false);
            await this.userState.saveChanges(turnContext, false);
            break;
        case ActivityTypes.ConversationUpdate:
            await this.sendWelcomeMessage(turnContext);
            break;
        case ActivityTypes.EndOfConversation:
        case ActivityTypes.DeleteUserData:
            break;
        default:
            break;
        }
    }

    async promptForLanguage(stepContext) {
        return await stepContext.prompt(LANGUAGE_PROMPT, {
            prompt: 'Please choose a language(there is more to come).',
            retryPrompt: 'Choose language from list',
            choices: ['English']
        });
    }

    async promptForLocation(stepContext) {
        stepContext.values.language = stepContext.result;

        return await stepContext.prompt(LOCATION_PROMPT, {
            prompt: 'Where are you from? (Type below)'
        });
    }

    async endUserFetch(stepContext) {
        stepContext.values.location = stepContext.result;

        await stepContext.context.sendActivity('Thank You for answers');

        return await stepContext.endDialog({
            language: stepContext.values.language.value,
            location: stepContext.values.location
        });
    }

    async promptForSection(stepContext) {
        return await stepContext.prompt(SECTION_PROMPT, {
            prompt: 'Please choose a section(there is more to come).',
            retryPrompt: 'Choose data from list',
            choices: ['IT & Computer Science', 'Languages', 'Formal Sciences', 'Earth & Space', 'Health']
        });
    }

    async promptForTopic(stepContext) {
        stepContext.values.section = stepContext.result.value;
        const section = stepContext.result.value;

        switch (section) {
        case 'IT & Computer Science':
            return await stepContext.prompt(TOPIC_PROMPT, {
                prompt: 'Please choose a topic(there is more to come).',
                retryPrompt: 'Choose data from list',
                choices: ['Python', 'Java#', 'Web Development', 'C++', 'Alghoritms', 'Network', 'Cloud Computing', 'Data Science', 'Databases']
            });
        case 'Languages':
            return await stepContext.prompt(TOPIC_PROMPT, {
                prompt: 'Please choose a topic(there is more to come).',
                retryPrompt: 'Choose data from list',
                choices: ['English', 'French', 'Spanish', 'Arabic', 'German', 'Gramar', 'Reading']
            });
        case 'Formal Sciences':
            return await stepContext.prompt(TOPIC_PROMPT, {
                prompt: 'Please choose a topic(there is more to come).',
                retryPrompt: 'Choose data from list',
                choices: ['Mathematics', 'Statistics', 'Logic', 'Algebra']
            });
        case 'Earth & Space':
            return await stepContext.prompt(TOPIC_PROMPT, {
                prompt: 'Please choose a topic(there is more to come).',
                retryPrompt: 'Choose data from list',
                choices: ['Astronomy', 'Geology', 'Geosicence', 'Planetary science']
            });
        case 'Health':
            return await stepContext.prompt(TOPIC_PROMPT, {
                prompt: 'Please choose a topic(there is more to come).',
                retryPrompt: 'Choose data from list',
                choices: ['First Aid', 'Mental Health', 'Dieting', 'Animal Healt']
            });
        default:
            break;
        }
        return await stepContext.prompt(TOPIC_PROMPT, {
            prompt: 'Please choose a topic(there is more to come).',
            retryPrompt: 'Choose data from list',
            choices: ['PYTHON', 'C#', 'C++', 'JavaScript', 'Java']
        });
    }

    async choseCourse(stepContext) {
        stepContext.values.topic = stepContext.result.value;

        return await stepContext.prompt(COURSE_PROMPT, {
            prompt: 'Please choose a course(there is more to come).',
            retryPrompt: 'Choose data from list',
            choices: ['Python: Execute a script', 'Python: interactive shell']
        });
    }

    async summarize(stepContext) {
        stepContext.values.course = stepContext.result.value;

        await stepContext.context.sendActivity(`Your choosen course is: ${ stepContext.values.course }`);
        this.courseSelect = stepContext.result.index;

        return await stepContext.endDialog({
            section: stepContext.values.section.value,
            topic: stepContext.values.topic,
            course: stepContext.values.course
        });
    }

    async promptSearch(stepContext) {
        return await stepContext.prompt(SERACH_PROMPT, {
            prompt: 'What are you looking for? (type below)'
        });
    }

    async searchChoseCourse(stepContext) {
        stepContext.values.topic = stepContext.result.value;

        return await stepContext.prompt(COURSE_PROMPT, {
            prompt: 'Please choose a course(there is more to come).',
            retryPrompt: 'Choose data from list',
            choices: ['Python: Execute a script', 'Python: variables']
        });
    }

    async summarizeSearch(stepContext) {
        stepContext.values.search = stepContext.result.value;
        await stepContext.context.sendActivity(`Your choosen course is: ${ stepContext.values.search }`);
        this.courseSelect = stepContext.result.index;
        return await stepContext.endDialog({
            search: stepContext.values.search.value,
            courseIndex: stepContext.result.index
        });
    }

    async displayCourse(stepContext) {
        // const index = this.searchCourseAccessor.get();
        if (typeof (this.courses[this.courseSelect][this.iterator]) === 'object') {
            if (!stepContext.options.display === true) {
                return await stepContext.prompt(NAVIGATION_PROMPT, {
                    prompt: 'Dou you want to display image? [5Kb]?',
                    retryPrompt: 'Answer with button',
                    choices: ['Yes', 'No']
                });
            } else {
                const img = require('./img.json');
                await stepContext.context.sendActivity({
                    attachments: [CardFactory.adaptiveCard(img)]
                });
                return await stepContext.prompt(NAVIGATION_PROMPT, {
                    prompt: 'Choose step',
                    retryPrompt: 'Choose step form button',
                    choices: ['<<<Previous', 'Next>>>']
                });
            }
        } else {
            await stepContext.context.sendActivity(`${ this.courses[this.courseSelect][this.iterator] }`);
        }

        return await stepContext.prompt(NAVIGATION_PROMPT, {
            prompt: '',
            retryPrompt: '',
            choices: ['<<<Previous', 'Next>>>']
        });
    }

    async loopCourse(stepContext) {
        if (this.iterator === this.courses[this.courseSelect].length - 1) {
            this.iterator = 0;
            return await stepContext.endDialog();
        }

        if (stepContext.result.value === 'Yes') {
            return await stepContext.replaceDialog(DISPLAY_COURSE_DIALOG, { display: true });
        }

        if (stepContext.result.value === 'No') {
            this.iterator++;
            return await stepContext.replaceDialog(DISPLAY_COURSE_DIALOG);
        }

        if (stepContext.result.value === '<<<Previous') {
            if (this.iterator === 0) {
                return await stepContext.replaceDialog(DISPLAY_COURSE_DIALOG);
            } else {
                if (typeof (this.courses[this.courseSelect][this.iterator - 1]) === 'object') {
                    this.iterator = this.iterator - 2;
                    return await stepContext.replaceDialog(DISPLAY_COURSE_DIALOG);
                } else {
                    this.iterator--;
                    return await stepContext.replaceDialog(DISPLAY_COURSE_DIALOG);
                }
            }
        }

        if (stepContext.result.value === 'Next>>>') {
            if (this.iterator === this.courses[this.courseSelect].length - 1) {
                this.iterator = 0;
                return await stepContext.endDialog();
            } else {
                this.iterator++;
                return await stepContext.replaceDialog(DISPLAY_COURSE_DIALOG);
            }
        }
    }

    async sendWelcomeMessage(turnContext) {
        if (turnContext.activity.membersAdded.length !== 0) {
            for (let idx in turnContext.activity.membersAdded) {
                if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                    const userProfile = await this.userProfile.get(turnContext, null);
                    await turnContext.sendActivity(`Welcome to KoyaBot. To start conversation type 'hi'`);
                    if (userProfile) {
                        await turnContext.sendActivity(`Your choosen languege is ${ userProfile.language }`);
                    }
                }
            }
        }
    }
}

module.exports.MyBot = MyBot;
