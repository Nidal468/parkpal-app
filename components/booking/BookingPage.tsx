'use client'
import { motion } from "framer-motion"
import BookingHeader from "./BookingHeader"
import BookingForm from "./BookingForm"
import BookingSummary from "./BookingSummary"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function BookingPage(props: any) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="min-h-screen bg-white"
    >
      <BookingHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="grid grid-cols-1 lg:grid-cols-3 gap-10"
        >
          <BookingForm {...props} />
          <BookingSummary {...props} />
        </motion.div>
      </div>
    </motion.div>
  )
}
