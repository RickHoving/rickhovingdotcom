import React from 'react';
import styles from './ProfileImage.module.scss';

const ProfileImage: React.FC = () => (
  <div className={styles.profileImageContainer}>
    <img
      src="/The%20Creators%20Hub%20-%20SYGNO%20-%2001817-2.jpg"
      alt="Rick Hoving profile"
      className={styles.profileImage}
    />
    <div className={styles.profileName}>Rick Hoving</div>
  </div>
);

export default ProfileImage;
