
import React from 'react';
import styles from './SkillsAlt.module.scss';

const skills = [
  { name: 'JavaScript', level: 95, icon: '🟨' },
  { name: 'TypeScript', level: 90, icon: '🟦' },
  { name: 'React', level: 92, icon: '⚛️' },
  { name: 'SCSS / Sass', level: 85, icon: '🎨' },
  { name: 'HTML', level: 98, icon: '📄' },
  { name: 'C#', level: 80, icon: '♯' },
];

const languages = [
  { name: 'Dutch', tag: 'Native' },
  { name: 'English', tag: 'Full Professional' },
  { name: 'German', tag: 'Limited' },
  { name: 'French', tag: 'Elementary' },
  { name: 'Spanish', tag: 'Elementary' },
];

const Circle = ({ percent, label, icon }: { percent: number; label: string; icon: string }) => (
  <div className={styles.circleWrapper}>
    <div className={styles.codeIcon}>{icon}</div>
    <svg className={styles.circle} width="70" height="70" viewBox="0 0 70 70">
      <defs>
        <linearGradient id="skillNeon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00ffe7" />
          <stop offset="100%" stopColor="#4f8cff" />
        </linearGradient>
      </defs>
      <circle
        className={styles.circleBg}
        cx="35"
        cy="35"
        r="30"
        strokeWidth="8"
        fill="none"
      />
      <circle
        className={styles.circleFg}
        cx="35"
        cy="35"
        r="30"
        strokeWidth="8"
        fill="none"
        strokeDasharray={2 * Math.PI * 30}
        strokeDashoffset={2 * Math.PI * 30 * (1 - percent / 100)}
        style={{ stroke: 'url(#skillNeon)' }}
      />
      <text x="35" y="40" textAnchor="middle" fontSize="18" fill="#00ffe7" fontWeight="bold" fontFamily="Fira Mono, monospace">
        {percent}%
      </text>
    </svg>
    <div className={styles.circleLabel}>
      <span className={styles.codeFont}>{label}</span>
    </div>
  </div>
);

const SkillsAlt: React.FC = () => (
  <section className={styles.skillsAlt}>
    <div className={styles.terminalCard}>
      <div className={styles.terminalHeader}>
        <span className={styles.dotRed}></span>
        <span className={styles.dotYellow}></span>
        <span className={styles.dotGreen}></span>
        <span className={styles.terminalTitle}>skills.ts</span>
      </div>
      <div className={styles.terminalBody}>
        <h2 className={styles.codeFont}>Skills</h2>
        <div className={styles.circlesRow}>
          {skills.map(skill => (
            <Circle key={skill.name} percent={skill.level} label={skill.name} icon={skill.icon} />
          ))}
        </div>
        <h2 className={styles.codeFont}>Languages</h2>
        <div className={styles.languageTags}>
          {languages.map(lang => (
            <span key={lang.name} className={styles.languageTag}>
              {lang.name} <span className={styles.languageLevel}>{lang.tag}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default SkillsAlt;
