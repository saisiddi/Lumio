"use client";

import { motion } from "framer-motion";
import { Code, Globe, Briefcase, Mail } from "lucide-react";

const team = [
  {
    name: "Alex Rivera",
    role: "Frontend Engineer",
    image: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    bio: "Obsessed with micro-interactions and performance.",
  },
  {
    name: "Sarah Chen",
    role: "UX / UI Designer",
    image: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    bio: "Creating inclusive experiences for everyone.",
  },
  {
    name: "Marcus Johnson",
    role: "Backend Architecture",
    image: "https://i.pravatar.cc/150?u=a04258114e29026702d",
    bio: "Scaling the analysis engine to handle millions of DOM nodes.",
  },
  {
    name: "Emily Davis",
    role: "Accessibility Expert",
    image: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
    bio: "CPACC certified. Making sure our ruleset is bulletproof.",
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-black pt-32 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-24"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md text-sm font-medium mb-8">
            <span className="text-brand-violet font-semibold tracking-widest uppercase text-xs">Hackathon Project</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6">
            Meet the Builders
          </h1>
          <p className="text-xl text-zinc-400 font-light tracking-wide leading-relaxed">
            We are a team of passionate engineers and designers who believe the web should be accessible to everyone, regardless of their abilities.
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-3xl p-6 group hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 text-center">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-6 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">{member.name}</h3>
                <p className="text-brand-blue text-sm font-medium tracking-wide mb-4">{member.role}</p>
                <p className="text-zinc-400 text-sm font-light leading-relaxed mb-6">
                  {member.bio}
                </p>
                <div className="flex justify-center gap-3">
                  <a href="#" className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                    <Globe className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                    <Code className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                    <Briefcase className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center text-white mb-16 tracking-tight">Our 24-Hour Journey</h2>
          <div className="relative border-l border-white/10 ml-4 md:ml-0 md:pl-0 space-y-12">
            
            <div className="relative pl-8 md:pl-1/2 md:flex items-center justify-between">
              <div className="absolute left-[-5px] md:left-[50%] md:-translate-x-[5px] w-2.5 h-2.5 rounded-full bg-brand-blue shadow-[0_0_10px_rgba(0,229,255,0.8)]" />
              <div className="md:w-[45%] text-left md:text-right md:pr-12">
                <div className="text-sm font-mono text-brand-blue mb-1">Hour 1</div>
                <h4 className="text-xl font-bold text-white mb-2">Ideation</h4>
                <p className="text-zinc-400 font-light">Defined the core problem: Accessibility audits are boring. We decided to make them cinematic.</p>
              </div>
              <div className="hidden md:block w-[45%]" />
            </div>

            <div className="relative pl-8 md:pl-1/2 md:flex items-center justify-between flex-row-reverse">
              <div className="absolute left-[-5px] md:left-[50%] md:-translate-x-[5px] w-2.5 h-2.5 rounded-full bg-brand-violet shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
              <div className="md:w-[45%] text-left md:pl-12">
                <div className="text-sm font-mono text-brand-violet mb-1">Hour 12</div>
                <h4 className="text-xl font-bold text-white mb-2">The Stickman Rig</h4>
                <p className="text-zinc-400 font-light">Built a custom Framer Motion physics rig from scratch for our hero character.</p>
              </div>
              <div className="hidden md:block w-[45%]" />
            </div>

            <div className="relative pl-8 md:pl-1/2 md:flex items-center justify-between">
              <div className="absolute left-[-5px] md:left-[50%] md:-translate-x-[5px] w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              <div className="md:w-[45%] text-left md:text-right md:pr-12">
                <div className="text-sm font-mono text-white mb-1">Hour 24</div>
                <h4 className="text-xl font-bold text-white mb-2">Vercel Deployment</h4>
                <p className="text-zinc-400 font-light">Final polish, performance optimizations, and pushing the production build.</p>
              </div>
              <div className="hidden md:block w-[45%]" />
            </div>

          </div>
        </motion.div>

      </div>
    </div>
  );
}
