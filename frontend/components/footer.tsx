"use client"

import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="relative py-4 sm:py-12 md:py-8">
      <div className="text-center">
            <span className="text-muted-foreground text-2xl">Team</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              className="text-primary  text-2xl"
            >
              {" "} - {" "}
            </motion.span>
            <span className="text-muted-foreground text-2xl">abhishek_2301cb02</span>
          </div>
    </footer>
  );
};

export default Footer;
