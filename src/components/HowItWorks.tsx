import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { FileText, UserCheck, Car, Rocket } from "lucide-react";

const steps = [
  {
    icon: FileText,
    step: "01",
    title: "Submit Application",
    description: "Fill out our comprehensive application form with your driving history and required documents.",
  },
  {
    icon: UserCheck,
    step: "02",
    title: "Verification",
    description: "Our team reviews your application and verifies your credentials within 24-48 hours.",
  },
  {
    icon: Car,
    step: "03",
    title: "Vehicle Assignment",
    description: "Once approved, we match you with a vehicle that suits your needs and preferences.",
  },
  {
    icon: Rocket,
    step: "04",
    title: "Start Earning",
    description: "Get your keys, complete orientation, and start earning with Uber or Bolt immediately.",
  },
];

const HowItWorks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="section-padding relative" ref={ref}>
      {/* Background Accent */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">Process</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mt-4 mb-6">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Getting started with GridCraft is simple. Follow these four easy steps 
            to begin your journey towards driving success.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              <div className="glass-card p-8 h-full relative overflow-hidden">
                {/* Step Number */}
                <div className="absolute -top-4 -right-4 text-8xl font-display font-bold text-primary/10">
                  {step.step}
                </div>
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl gradient-border bg-card flex items-center justify-center mb-6">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-xl mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
