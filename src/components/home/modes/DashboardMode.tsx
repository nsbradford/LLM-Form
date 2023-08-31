import { Form, Response, User } from '@/types';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Button, Group, ActionIcon } from '@mantine/core';



type DashboardModeProps = {
    user: User;
    forms: Form[];
    responses: Record<string, Response[]>;
    onNewFormClick: () => void;
    onFormDetailClick: (formId: string) => void;
}


export default function DashboardMode(props: DashboardModeProps) {

    if (props.forms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="text-2xl font-semibold text-gray-900">You have no forms</h1>
                <p className="mt-2 text-sm text-gray-500">Create a form to get started</p>
                <Button onClick={props.onNewFormClick}>
                    Create a form
                </Button>
            </div>
        );
    } else {
        return (
            <>
              <Group position={'right'}>
                  <Button onClick={props.onNewFormClick}>
                      New form
                  </Button>
              </Group>
                <ul role="list" className="divide-y divide-gray-100">
                {props.forms.map((f) => {
                    const responsesForThisForm = props.responses[f.id] || [];
                    const badgeColor = f.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                    const camelCaseTitle = f.name.charAt(0).toUpperCase() + f.name.slice(1, f.name.length)
                    return (
                        <li key={f.id} className="flex justify-between gap-x-6 py-5">
                            <div className="flex min-w-0 gap-x-4">
                                <div className="min-w-0 flex-auto">
                                    <div className="flex gap-x-6 ">
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${badgeColor} ring-1 ring-inset ring-gray-500/10`}>
                                            {f.is_open ? 'Open' : 'Closed'}
                                        </span>
                                        <p className="text-sm font-semibold leading-6 text-gray-900">{camelCaseTitle}</p>
                                    </div>
                                <p className="mt-1 truncate text-xs leading-5 text-gray-500">{f.description || f.desired_fields_schema.slice(0,64) + '...'}</p>
                                </div>
                            </div>
                            <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                                <div className="flex gap-x-2 ">
                                    <Button
                                        onClick={() => props.onFormDetailClick(f.id)}
                                        variant={'subtle'}
                                    >
                                        View responses
                                    </Button>
                                    { f.is_open ? <ActionIcon variant={'subtle'}> <LinkIcon className="h-5 w-5" aria-hidden="true" /> </ActionIcon> : null }
                                    
                                </div>
                                <p className="mt-1 text-xs leading-5 text-gray-500">
                                {responsesForThisForm.length === 0 ? 'No responses yet' : responsesForThisForm.length + ' responses'}
                                </p>
                            </div>
                        </li>
                    );
                })}
                </ul>
            </>
        ); 
    }
}
