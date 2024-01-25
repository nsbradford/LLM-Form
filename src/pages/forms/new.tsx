import { useState, useEffect } from 'react';
import { Database } from '../../../types/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChatMessage, User } from '@/models';
import { v4 } from 'uuid';
import { callLLM, getUserFromSupabase } from '@/utils';
import { PROMPT_BUILD } from '@/prompts';
import { removeStartAndEndQuotes } from '@/utils';
import Page from '@/components/layout/Page';
import { useRouter } from 'next/router';
import { useSessionContext } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import { Spinner } from '@/components/settings/Spinner';

type NewFormPageProps = {
  user: User;
  onCancelClick: () => void;
  onSuccessfulSubmit: () => void;
};

export default function NewFormPage(props: NewFormPageProps) {
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState(1);
  // const [description, setDescription] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [title, setTitle] = useState('');
  const [fieldsGuidance, setFieldsGuidance] = useState('');
  const [fieldsSchema, setFieldsSchema] = useState('{}');
  const { push } = useRouter();
  const [user, setUser] = useState<null | User>(null);
  const { isLoading: isSessionLoading, session, error } = useSessionContext();
  const [loadingMessage, setLoadingMessage] = useState('Building form...');
  const showSpinner = step === 1.5 || isLoading;

  useEffect(() => {
    if (!isSessionLoading && !session) {
      push('/auth');
    }
    if (!isSessionLoading && session) {
      getUserFromSupabase(session, supabase, setUser);
    }
  }, [isSessionLoading, session]);

  useEffect(() => {
    if (step === 1.5) {
      const interval = setInterval(() => {
        setLoadingMessage((prev) =>
          prev === 'Building form...'
            ? 'Educating chat agent...'
            : 'Building form...'
        );
      }, 3000);

      return () => clearInterval(interval); // Clear the interval when component unmounts or step changes
    }
  }, [step]);

  async function onFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (user === null) {
      return;
    }
    event.preventDefault();
    setIsLoading(true);
    const formId = v4();
    await supabase.from('forms').insert([
      {
        description: formTopic, // we're deleting the intermediate description
        raw_instructions: formTopic,
        fields_guidance: fieldsGuidance,
        fields_schema: fieldsSchema,
        id: formId,
        is_open: true,
        name: title,
        user_id: user.id,
      },
    ]);
    setIsLoading(false);
    push(`/forms/${formId}`);
  }

  const transitionToStep2WithLLM = async () => {
    setStep(1.5);
    const conversationThread: ChatMessage[] = [
      {
        role: 'user',
        content:
          'Here is a short text description of what I want to create a survey form about: ' +
          formTopic +
          '\n' +
          'What should the title of this survey form be? Respond with just the title, no other text, prefixes, or annotations, e.g. "Birthday Party RSVP", "Doctors\'s Office Intake", "Marketing Survey", etc.',
      },
    ];
    const titleResponse = await callLLM(PROMPT_BUILD, conversationThread);
    if (titleResponse instanceof Error) {
      console.error('No response from LLM');
      setStep(1);
      return;
    }
    setTitle(removeStartAndEndQuotes(titleResponse.content) || '');

    console.log('titleResponse', titleResponse);
    conversationThread.push(titleResponse);
    // conversationThread.push({
    //   role: 'user',
    //   content: `Create a short description of this survey form. This description will be given to a person who is in charge of administering the form data collection. This person will use this description to understand what the form is about, so that they can collect the correct information from respondents.  Don't include information that is not relevant to the form, or state that this is a form. This survey administrator already knows that, instead they care about information relation the forms content. For example, if you want to collect a respondent\'s name and age, you can write: "This form is to collect the names and ages of people attending a birthday party."`,
    // });
    // const descriptionResponse = await callLLM(PROMPT_BUILD, conversationThread);
    // if (descriptionResponse instanceof Error) {
    //   console.error('No response from LLM');
    //   setStep(1);
    //   return;
    // }
    // setDescription(removeStartAndEndQuotes(descriptionResponse.content) || '');

    // console.log('descriptionResponse', descriptionResponse);
    // conversationThread.push(descriptionResponse);
    conversationThread.push({
      role: 'user',
      content: `Now, we must write instructions to the survey administrator. Write any guidance that the administrator will need, such as conditional information to collect or how to answer questions.  The survey administrator will reference this guidence when deciding which follow up questions to ask or how to interpret the answers. Be concise.

Examples:
-If you want to collect a RSVP for a birthday party, including the number of guests attending, you may write "Please include the number of guests attending the birthday party (skip if RSVP is no)." because it doesn\'t make sense to ask for the number of guests if the respondent is not attending.
-If a question is a Yes/No question, or has to pass certain validation checks, make a note, e.g. "RSVP: yes/no".

Example instructions:
----
Movie Night RSVP
- Name: string (double check with user if it doesn't look like a real name)
- Email: valid email address
- RSVP: yes/no

If RSVP is yes:
- Number of guests: number (double check with user if more than 10)
- Dietary restrictions: string
----

----
Startup marketing survey
- Name: string (double check with user if it doesn't look like a real name)
- Email: valid email address
- Company name: string
- Job title: string

If job title is some kind of software engineer or related (ML engineer, data scientist, engineering manager, etc.):
- GitHub username: string (just the username, not the full URL. Extract if necessary.)

All respondents:
- Marketing technologies: string (comma separated list of marketing technologies used)
----

        `,
    });

    const fieldsGuidanceResponse = await callLLM(
      PROMPT_BUILD,
      conversationThread
    );
    if (fieldsGuidanceResponse instanceof Error) {
      console.error('No response from LLM');
      setStep(1);
      return;
    }
    setFieldsGuidance(
      removeStartAndEndQuotes(fieldsGuidanceResponse.content) || ''
    );

    console.log('fieldsGuidanceResponse', fieldsGuidanceResponse);
    conversationThread.push(fieldsGuidanceResponse);
    conversationThread.push({
      role: 'user',
      content: `Now return a JSON object that will serve as a template for the form responses. This object should have keys that are strings and values that are strings. The keys are the names of the fields that the survey administrator should attempt to obtain. They values should be descriptions of those fields, including any formatting information or non-obvious ways to validate the provided information. Keys should be in \`snake_case\`. Be concise.

Examples:
Input:
- GitHub username: GitHub username. Extract if necessary, e.g. if user provides URL.

Your output:
{
  "github_username": "GitHub username. Extract if necessary, e.g. if user provides URL."
}

        `,
    });

    const fieldsSchemaResponse = await callLLM(
      PROMPT_BUILD,
      conversationThread
    );
    if (fieldsSchemaResponse instanceof Error) {
      console.error('No response from LLM');
      setStep(1);
      return;
    }
    const fieldsSchema = fieldsSchemaResponse.content || '{}';
    const fieldsSchemaJSON = JSON.parse(fieldsSchema);
    setFieldsSchema(fieldsSchemaJSON);
    setStep(2);
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="sm:col-span-4 px-4">
          <label
            htmlFor="formTopic"
            className="block text-xl font-medium leading-6 text-gray-900"
          >
            What is your form about?
          </label>
          <p className="text-sm text-gray-500 mt-2 mb-4">
            {'Describe in words what information you want to collect.'}
          </p>
          <div className="mt-2">
            <textarea
              id="formTopic"
              rows={5}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={formTopic}
              onChange={(e) => setFormTopic(e.target.value)}
              placeholder="Birthday party RSVP, # of guests, dietary restrictions..."
            />
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={transitionToStep2WithLLM}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Next
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="col-span-full px-4">
          <div className="sm:col-span-4">
            {formTopic !== '' && (
              <>
                <label
                  htmlFor="description"
                  className="block mt-0 text-md font-medium leading-6 text-gray-900"
                >
                  Your Description
                </label>
                <div className="mt-2">
                  <textarea
                    id="description"
                    rows={5}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Adding a description can help us gather the correct information from respondents..."
                  />
                </div>
              </>
            )}

            {title !== '' && (
              <>
                <label
                  htmlFor="title"
                  className="block mt-6 text-md font-medium leading-6 text-gray-900"
                >
                  Title
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="title"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Birthday party RSVP"
                  />
                </div>
              </>
            )}

            {fieldsGuidance !== '' && (
              <>
                <label
                  htmlFor="fields_guidance"
                  className="block mt-6 text-md font-medium leading-6 text-gray-900"
                >
                  Guidance
                </label>
                <div className="mt-2">
                  <textarea
                    id="fields_guidance"
                    rows={5}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    value={fieldsGuidance}
                    onChange={(e) => setFieldsGuidance(e.target.value)}
                    placeholder="Write any information that will help respondents fill out this form..."
                  />
                </div>
              </>
            )}

            {fieldsSchema !== '{}' && (
              <>
                <div>
                  <div className="mt-4">
                    <label
                      htmlFor="fields_guidance"
                      className="block mt-6 text-md font-medium leading-6 text-gray-900"
                    >
                      Fields Schema:
                    </label>

                    <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap text-sm">
                      {JSON.stringify(fieldsSchema, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
          {showSpinner && (
            <div className="flex flex-col items-center justify-center py-8">
              <Spinner />
              <div className="text-gray-600 my-4">{loadingMessage}</div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <Page user={null} pageTitle={'New form'}>
      <form onSubmit={onFormSubmit}>
        <div className="space-y-12">
          <div className="border-b border-gray-900/10 pb-12">
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              {renderStepContent()}
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-x-6 px-4">
          {step === 2 && (
            <Link href="/home">
              <button
                type="button"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Cancel
              </button>
            </Link>
          )}
          {step === 2 && (
            <button
              type="submit"
              disabled={showSpinner}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Save
            </button>
          )}
        </div>
      </form>
    </Page>
  );
}
