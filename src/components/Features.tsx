import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Wallet, Clock, Wrench, Users, CheckCircle, Zap } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Flexible Payment Plans",
    description: "Choose between weekly or monthly payments that fit your earning schedule. No hidden fees, transparent pricing.",
  },
  {
    icon: Clock,
    title: "Quick Approval",
    description: "Get approved within 24-48 hours. Our streamlined process gets you on the road faster.",
  },
  {
    icon: Wrench,
    title: "Maintenance Included",
    description: "Regular servicing and maintenance covered. Focus on driving while we handle the upkeep.",
  },
  {
    icon: Users,
    title: "Driver Community",
    description: "Join our network of successful drivers. Share tips, get support, and grow together.",
  },
  {
    icon: CheckCircle,
    title: "Insurance Coverage",
    description: "Comprehensive insurance included in your package. Drive with peace of mind.",
  },
  {
    icon: Zap,
    title: "Modern Fleet",
    description: "Fuel-efficient vehicles optimized for ride-sharing. Lower costs, higher earnings.",
  },
];

const Features = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="section-padding relative" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">Why Choose Us</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mt-4 mb-6">
            Everything You Need to <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We provide more than just vehicles. Our comprehensive packages are designed 
            to help drivers maximize their earnings and build sustainable businesses.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-card-hover p-8"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;