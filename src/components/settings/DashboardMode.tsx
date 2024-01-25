import { SpinnerFullPage } from '@/components/settings/Spinner';
import { Form, Response, User } from '@/models';
import { getFormsFromSupabase, getResponsesFromSupabase } from '@/utils';
import { LinkIcon } from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSessionContext } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Database } from '../../../types/supabase';
import { titleGradient, titleGradientHover } from '../misc';

export default function DashboardMode(props: { user: User | null }) {
  const { user } = props;
  const { isLoading: isSessionLoading, session, error } = useSessionContext();
  const supabase = createClientComponentClient<Database>();
  const [allForms, setAllForms] = useState<Form[] | null>(null);
  const [formIdToResponses, setFormIdToResponses] = useState<Record<
    string,
    Response[]
  > | null>(null);

  useEffect(() => {
    const getFormsAndResponses = async () => {
      if (user === null) {
        return;
      }
      const forms = await getFormsFromSupabase(user.id, supabase);
      if (forms === undefined) {
        return;
      } else if (forms.length === 0) {
        setAllForms(forms);
        setFormIdToResponses({} as Record<string, Response[]>);
        return;
      }
      setAllForms(forms);
      const allResposes = {} as Record<string, Response[]>;
      for (const form of forms) {
        const formResponses = await getResponsesFromSupabase(form.id, supabase);
        if (formResponses === undefined) {
          continue;
        }
        allResposes[form.id] = formResponses as Response[];
      }
      setFormIdToResponses(allResposes);
    };
    if (user !== null && allForms === null && formIdToResponses === null) {
      getFormsAndResponses();
    }
  }, [isSessionLoading, user, allForms, formIdToResponses]);

  if (user === null || allForms === null || formIdToResponses === null) {
    return <SpinnerFullPage />;
  } else if (allForms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-semibold text-gray-900">
          You have no forms
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Create a form to get started
        </p>

        <Link
          href={'/forms/new'}
          className={`inline-block ${titleGradient} text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out ${titleGradientHover}`}
        >
          {/* <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"> */}
          New form
          {/* </button> */}
        </Link>
      </div>
    );
  } else {
    return (
      <div className="px-4">
        <Link
          href={'/forms/new'}
          className={`inline-block ${titleGradient} text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out ${titleGradientHover} mb-10`}
        >
          New form
        </Link>
        {allForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-semibold text-gray-900">
              You have no forms
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Create a form to get started
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200 space-y-4">
            {allForms.map((f) => {
              const responsesForThisForm = formIdToResponses[f.id] || [];
              const badgeColor = f.is_open
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800';
              const camelCaseTitle =
                f.name.charAt(0).toUpperCase() + f.name.slice(1, f.name.length);

              return (
                <li
                  key={f.id}
                  className="flex flex-wrap justify-between gap-4 py-5"
                >
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-4">
                      <Link href={`/forms/${f.id}`}>
                        <p className="text-md font-semibold leading-6 text-indigo-600 hover:text-indigo-400">
                          {camelCaseTitle}
                        </p>
                      </Link>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${badgeColor} ring-1 ring-inset ring-gray-500/10`}
                      >
                        {f.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <div className="">
                      {f.created_at && (
                        <p className="text-xs text-gray-400 font-mono my-2">
                          Created:{' '}
                          {new Date(f.created_at).toLocaleDateString(
                            undefined,
                            {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                            }
                          )}{' '}
                          {new Date(f.created_at).toLocaleTimeString(
                            undefined,
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      )}
                      <p className="text-xs leading-5 text-gray-600">
                        {f.description
                          ? f.description.slice(0, 128) + '...'
                          : f.raw_instructions.slice(0, 128) + '...'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-4 sm:mt-0">
                    <div className="flex gap-2">
                      <Link href={'/forms/' + f.id}>
                        <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                          View responses
                        </button>
                      </Link>
                      {f.is_open ? (
                        <Link href={'/forms/entry/' + f.id}>
                          <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                            <LinkIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </Link>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-gray-500 sm:mt-0">
                      {responsesForThisForm.length === 0
                        ? 'No responses yet'
                        : responsesForThisForm.length + ' responses'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
}
