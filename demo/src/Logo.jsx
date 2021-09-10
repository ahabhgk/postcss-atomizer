import React from 'react'
import logo from './logo.svg'
import styles from './Logo.module.css'

export default function Logo() {
  return <img src={logo} className={styles.AppLogo} alt="logo" />
}
