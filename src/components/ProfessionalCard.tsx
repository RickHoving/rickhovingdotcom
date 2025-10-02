import React from 'react';
import styles from './ProfessionalCard.module.scss';

interface ProfessionalCardProps {
  title: string;
  description: string;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ title, description }) => (
  <div className={styles.card}>
    <h2>{title}</h2>
    <p>{description}</p>
  </div>
);

export default ProfessionalCard;
