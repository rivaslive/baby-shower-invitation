import { motion } from 'framer-motion'

export default function Page({ className = '', children }) {
  return (
    <motion.main
      className={`page ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
    >
      <div className="page-backdrop" aria-hidden />
      {children}
    </motion.main>
  )
}
