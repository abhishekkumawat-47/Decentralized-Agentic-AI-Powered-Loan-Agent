"use client"

import { motion } from 'framer-motion';

const rowOne = [
  'LANGGRAPH',
  'PHI 4',
  'GROK',
  'FASTAPI',
  'PYTHON',
  'AI AGENTS',
  'IPFS',
  'DOCKER',
  'KUBERNETES',
  'PROMETHEUS',
  'GRAFANA',
];

const rowTwo = [
  'REDIS',
  'MONGODB',
  'POSTGRESQL',
  'NEXT.JS',
  'REACT JS',
  'TYPESCRIPT',
  'HYPERLEDGER FABRIC',
  'ETHEREUM',
  'SOLIDITY',
  'BLOCKCHAIN',
  'SMART CONTRACTS',
];

const PartnersMarquee = () => {
  // Triple each row for seamless infinite loop
  const allPartnersRowOne = [...rowOne, ...rowOne, ...rowOne];
  const allPartnersRowTwo = [...rowTwo, ...rowTwo, ...rowTwo];

  return (
    <section className="py-6 overflow-hidden glass-card border-y border-primary/20">
      <div className="relative space-y-8">
        {/* First Row - Moving Left */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex gap-0"
          animate={{
            x: [0, '-33.33%'],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
        >
          {allPartnersRowOne.map((partner, index) => (
            <div
              key={`row1-${partner}-${index}`}
              className="pt-6 pb-3 flex items-center gap-3 sm:gap-4 mx-8 sm:mx-12 shrink-0"
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary pulse-glow" />
              <span className="text-sm sm:text-lg font-semibold tracking-widest text-gray-400 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap">
                {partner}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Second Row - Moving Right */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex gap-0"
          animate={{
            x: ['-33.33%', 0],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
        >
          {allPartnersRowTwo.map((partner, index) => (
            <div
              key={`row2-${partner}-${index}`}
              className="pb-6 pt-3 flex items-center gap-3 sm:gap-4 mx-8 sm:mx-12 shrink-0"
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary pulse-glow" />
              <span className="text-sm sm:text-lg font-semibold tracking-widest text-gray-400 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap">
                {partner}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PartnersMarquee;