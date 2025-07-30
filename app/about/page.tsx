"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Users,
  Zap,
  Shield,
  ArrowRight,
  Check,
  Star,
  Play,
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminSidebar from "@/components/layouts/AdminSidebar";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
  >
    <Card className="p-6 h-full bg-background border-primary hover:border-primary/80 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </Card>
  </motion.div>
);

interface TestimonialCardProps {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  delay?: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  name,
  role,
  company,
  content,
  rating,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
  >
    <Card className="p-6 bg-background border-purple-200 hover:shadow-lg transition-all duration-300">
      <div className="space-y-4">
        <div className="flex space-x-1">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-muted-foreground italic">"{content}"</p>
        <div>
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">
            {role} at {company}
          </p>
        </div>
      </div>
    </Card>
  </motion.div>
);

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  delay?: number;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  period,
  features,
  popular = false,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="relative"
  >
    {popular && (
      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white">
        Most Popular
      </Badge>
    )}
    <Card
      className={`p-6 h-full ${
        popular
          ? "border-purple-500 shadow-lg shadow-purple-100"
          : "border-purple-200"
      }`}
    >
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <div className="mt-4">
            <span className="text-4xl font-bold text-primary">{price}</span>
            <span className="text-muted-foreground">/{period}</span>
          </div>
        </div>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          className={`w-full ${
            popular
              ? "bg-primary text-white hover:bg-primary/80"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        >
          Get Started
        </Button>
      </div>
    </Card>
  </motion.div>
);

export default function About() {
  const features = [
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Instant Sharing",
      description:
        "Share your contact info with a simple tap or scan. No more fumbling with business cards.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Management",
      description:
        "Manage your entire team's digital business cards from one central dashboard.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Updates",
      description:
        "Update your information once and it's instantly reflected across all your shared cards.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description:
        "Your data is encrypted and secure. You control what information you share.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Sales Director",
      company: "TechCorp",
      content:
        "Delighto has revolutionized how our sales team networks. We've seen a 40% increase in follow-ups.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Entrepreneur",
      company: "StartupXYZ",
      content:
        "The convenience of digital business cards is unmatched. I never run out of cards again!",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Marketing Manager",
      company: "GrowthCo",
      content:
        "Our team loves the analytics features. We can track engagement and optimize our networking.",
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      title: "Starter",
      price: "$9",
      period: "month",
      features: [
        "1 Digital Business Card",
        "Basic Analytics",
        "Email Support",
        "Mobile App Access",
      ],
    },
    {
      title: "Professional",
      price: "$19",
      period: "month",
      features: [
        "5 Digital Business Cards",
        "Advanced Analytics",
        "Priority Support",
        "Custom Branding",
        "Lead Generation Tools",
      ],
      popular: true,
    },
    {
      title: "Enterprise",
      price: "$49",
      period: "month",
      features: [
        "Unlimited Cards",
        "Team Management",
        "White-label Solution",
        "API Access",
        "Dedicated Support",
      ],
    },
  ];

  return (
    <main>
      <div className="flex h-screen flex-col sm:flex-row">
        <AdminSidebar />
        <div className="sm:pt-3 bg-primary w-full overflow-x-hidden pb-6 sm:pb-0">
          <div className="overflow-y-auto h-full sm:rounded-tl-3xl bg-white animate-in fade-in duration-500">
            {/* Hero Section */}
            <section className="pt-8 pb-16 px-4 sm:px-6 lg:px-8">
              <div className="container mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                  >
                    <div className="space-y-6">
                      <Badge className="bg-primary text-white hover:bg-primary/80 cursor-pointer">
                        🚀 The Future of Networking
                      </Badge>
                      <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                        Digital Business Cards That
                        <span className="text-primary"> Actually Work</span>
                      </h1>
                      <p className="text-xl text-muted-foreground leading-relaxed">
                        Share your contact information instantly with a tap. No
                        more paper cards, no more lost connections. Join
                        thousands of professionals who've made the switch.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        size="lg"
                        className="bg-primary text-white hover:bg-primary/80"
                      >
                        Start Free Trial
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/10"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Watch Demo
                      </Button>
                    </div>

                    <div className="flex items-center space-x-8 pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          50K+
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Active Users
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          1M+
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Cards Shared
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          99%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Satisfaction
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative"
                  >
                    <div className="relative z-10">
                      <Card className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <div className="space-y-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xl">
                                JD
                              </span>
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-foreground">
                                John Doe
                              </h3>
                              <p className="text-primary">
                                Senior Sales Manager
                              </p>
                              <p className="text-muted-foreground">
                                TechCorp Solutions
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span className="text-sm">john@techcorp.com</span>
                            </div>
                            <div className="flex items-center space-x-2 text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span className="text-sm">+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center space-x-2 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">New York, NY</span>
                            </div>
                            <div className="flex items-center space-x-2 text-muted-foreground">
                              <Globe className="w-4 h-4" />
                              <span className="text-sm">techcorp.com</span>
                            </div>
                          </div>

                          <div className="flex space-x-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <Linkedin className="w-4 h-4 text-white" />
                            </div>
                            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                              <Twitter className="w-4 h-4 text-white" />
                            </div>
                            <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                              <Instagram className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-200 rounded-full opacity-50"></div>
                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-300 rounded-full opacity-30"></div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-purple-50/50">
              <div className="container mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-center space-y-4 mb-16"
                >
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                    Why Choose Digital Business Cards?
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Experience the future of networking with features designed
                    for modern professionals
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {features.map((feature, index) => (
                    <FeatureCard
                      key={index}
                      icon={feature.icon}
                      title={feature.title}
                      description={feature.description}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
              <div className="container mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-center space-y-4 mb-16"
                >
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                    Loved by Professionals Worldwide
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    See what our customers are saying about their networking
                    success
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {testimonials.map((testimonial, index) => (
                    <TestimonialCard
                      key={index}
                      name={testimonial.name}
                      role={testimonial.role}
                      company={testimonial.company}
                      content={testimonial.content}
                      rating={testimonial.rating}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Pricing Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-purple-50/50">
              <div className="container mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-center space-y-4 mb-16"
                >
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                    Simple, Transparent Pricing
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Choose the plan that fits your networking needs. No hidden
                    fees, cancel anytime.
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {pricingPlans.map((plan, index) => (
                    <PricingCard
                      key={index}
                      title={plan.title}
                      price={plan.price}
                      period={plan.period}
                      features={plan.features}
                      popular={plan.popular}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
              <div className="container mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="text-center space-y-8 max-w-3xl mx-auto"
                >
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                    Ready to Transform Your Networking?
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    Join thousands of professionals who've already made the
                    switch to digital business cards.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      className="bg-primary text-white hover:bg-primary/80"
                    >
                      Start Your Free Trial
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10"
                    >
                      Schedule Demo
                    </Button>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Footer */}
            <footer className="bg-primary text-white py-12 px-4 sm:px-6 lg:px-8">
              <div className="container mx-auto">
                <div className="grid md:grid-cols-4 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-sm">
                          D
                        </span>
                      </div>
                      <span className="text-xl font-bold">Delighto</span>
                    </div>
                    <p className="text-purple-200">
                      The future of networking is here. Share your contact
                      information instantly with digital business cards.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Product</h4>
                    <ul className="space-y-2 text-purple-200">
                      <li>
                        <a
                          href="#"
                          className="hover:text-white transition-colors"
                        >
                          Features
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="hover:text-white transition-colors"
                        >
                          Pricing
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="hover:text-white transition-colors"
                        >
                          Enterprise
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="hover:text-white transition-colors"
                        >
                          API
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Company</h4>
                    <ul className="space-y-2 text-purple-200">
                      <li>
                        <a
                          href="#"
                          className="hover:text-white transition-colors"
                        >
                          About
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="hover:text-white transition-colors"
                        >
                          Blog
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="hover:text-white transition-colors"
                        >
                          Careers
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="hover:text-white transition-colors"
                        >
                          Contact
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Support</h4>
                    <ul className="space-y-2 text-purple-200">
                      <li>
                        <a
                          href="#"
                          className="hover:text-white transition-colors"
                        >
                          Help Center
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="hover:text-white transition-colors"
                        >
                          Privacy Policy
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="hover:text-white transition-colors"
                        >
                          Terms of Service
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="hover:text-white transition-colors"
                        >
                          Status
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-primary-dark mt-8 pt-8 text-center text-white/40">
                  <p>&copy; 2024 Delighto. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
