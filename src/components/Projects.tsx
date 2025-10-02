import React from 'react';
import styles from './Projects.module.scss';
import ProfessionalCard from './ProfessionalCard';

const projects = [
  {
    title: 'Sygno',
    description: 'Lead Software Architect (Jul 2022 - Present)\nLeusden, Utrecht, Netherlands',
    link: 'https://sygno.nl/',
  },
  {
    title: 'AFAS Software',
    description: 'Software Architect (Aug 2014 - Jun 2022)\nLeusden\nResponsible for frontend and backend architecture, using TypeScript, MaquetteJs, and C#.',
    link: 'https://www.afas.nl/',
  },
  {
    title: 'Data Access Europe B.V.',
    description: 'Software Engineer (Aug 2011 - Sep 2013)\nHengelo\nWorked on web frameworks using JavaScript, HTML, CSS, AJAX, and Visual DataFlex.',
    link: 'https://www.dataaccess.eu/',
  },
  {
    title: 'de Internet Jongens B.V.',
    description: 'Intern Web Developer (Feb 2011 - Jul 2011)\nApeldoorn\nCreated a ticket management system using PHP, HTML, CSS, and JavaScript.',
    link: '#',
  },
  {
    title: 'G-ICT',
    description: 'Programmer trainee (Sep 2009 - Aug 2010)\nHengelo\nDesigned and implemented a SharePoint environment for MBO interns.',
    link: '#',
  },
];

const Projects: React.FC = () => (
  <section className={styles.projects}>
    <h2>Projects</h2>
    <div className={styles.cards}>
      {projects.map((project) => (
        <a href={project.link} key={project.title} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
          <ProfessionalCard title={project.title} description={project.description} />
        </a>
      ))}
    </div>
  </section>
);

export default Projects;
