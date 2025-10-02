import React from 'react';
import styles from './WorkExperience.module.scss';

const experiences = [
	{
		company: 'Sygno',
		title: 'Lead Software Architect',
		period: 'Jul 2022 - Present',
		location: 'Leusden, Netherlands',
		description:
			'Architecting and leading the development of scalable, innovative web solutions for the financial sector. Responsible for technical vision, mentoring, and hands-on coding.',
	},
	{
		company: 'AFAS Software',
		title: 'Software Architect',
		period: 'Aug 2014 - Jun 2022',
		location: 'Leusden, Netherlands',
		description:
			'Designed and implemented robust frontend and backend architectures. Led teams using TypeScript, MaquetteJs, and C#, driving product quality and developer productivity.',
	},
	{
		company: 'Data Access Europe B.V.',
		title: 'Software Engineer',
		period: 'Aug 2011 - Sep 2013',
		location: 'Hengelo, Netherlands',
		description:
			'Developed advanced web frameworks and tools using JavaScript, HTML, CSS, AJAX, and Visual DataFlex, improving developer experience and product capabilities.',
	},
	{
		company: 'de Internet Jongens B.V.',
		title: 'Intern Web Developer',
		period: 'Feb 2011 - Jul 2011',
		location: 'Apeldoorn, Netherlands',
		description:
			'Built a custom ticket management system from scratch using PHP, HTML, CSS, and JavaScript, streamlining client support workflows.',
	},
	{
		company: 'G-ICT',
		title: 'Programmer trainee',
		period: 'Sep 2009 - Aug 2010',
		location: 'Hengelo, Netherlands',
		description:
			'Designed and deployed a SharePoint environment for MBO interns, automating document management and collaboration.',
	},
];

const WorkExperience: React.FC = () => (
	<section>
		<h2 style={{ textAlign: 'center' }}>Work Experience</h2>
		<div className={styles.timeline}>
			{experiences.map((exp, idx) => (
				<React.Fragment key={exp.company + exp.period}>
					<div className={styles.timelineDate}>
						{experiences[idx].period}
					</div>
					<div className={styles.experience}>
						<div className={styles.expHeader}>
							<span className={styles.company}>{exp.company}</span>
							<span className={styles.title}>{exp.title}</span>
						</div>
						<span className={styles.location}>{exp.location}</span>
						<p className={styles.description}>{exp.description}</p>
					</div>
				</React.Fragment>
			))}
		</div>
	</section>
);

export default WorkExperience;
