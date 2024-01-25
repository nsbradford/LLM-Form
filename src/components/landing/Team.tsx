import React from 'react';
import TeamMember from './TeamMember';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTwitter,
  faLinkedin,
  faGithub,
} from '@fortawesome/free-brands-svg-icons';

interface Props {
  members: TeamMember[];
}

const Team: React.FC<Props> = ({ members }) => {
  return (
    <div className="container mx-auto p-8">
      <div className="">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map((member, index) => (
            <div
              key={index}
              className="p-4 rounded bg-gray-100 rounded-2xl border border-2 border-gray-200"
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-40 h-40 rounded-full mx-auto mb-4 border border-2 border-gray-400"
              />
              <h3 className="block text-center text-xl">{member.name}</h3>
              {member.subtitle && (
                <p className="text-gray-600 text-center">{member.subtitle}</p>
              )}
              {member.website && (
                <a
                  href={'https://' + member.website}
                  className="text-blue-500 hover:underline block text-center"
                >
                  {member.website}
                </a>
              )}
              <div className="mt-2 space-x-4 text-center">
                {member.socials.twitter == null ? (
                  <></>
                ) : (
                  <a
                    href={member.socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-500"
                  >
                    <FontAwesomeIcon
                      icon={faTwitter}
                      className="fa-fw text-gray-400 px-3 md:px-6 py-3 text-2xl hover:text-indigo-600 transition duration-200 hover:scale-125 ease-in-out "
                    />
                  </a>
                )}
                {member.socials.linkedIn && (
                  <a
                    href={member.socials.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-500"
                  >
                    <FontAwesomeIcon
                      icon={faLinkedin}
                      className="fa-fw text-gray-400 px-3 md:px-6 py-3 text-2xl hover:text-indigo-600 transition duration-200 hover:scale-125 ease-in-out "
                    />
                  </a>
                )}
                {member.socials.github && (
                  <a
                    href={member.socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-500"
                  >
                    <FontAwesomeIcon
                      icon={faGithub}
                      className="fa-fw text-gray-400 px-3 md:px-6 py-3 text-2xl hover:text-indigo-600 transition duration-200 hover:scale-125 ease-in-out "
                    />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;
