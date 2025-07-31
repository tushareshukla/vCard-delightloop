"use client";

import React, { useState, useEffect } from "react";
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
  User,
  LogOut,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { handleLogout } from "@/utils/logout";
import TempLogo from "@/components/ui/TempLogo";

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
  originalPrice?: string;
  period: string;
  features: string[];
  subscriptionOptions?: {
    monthly: { price: string; originalPrice: string };
    annual: { price: string; originalPrice: string };
  };
  popular?: boolean;
  delay?: number;
  isAuthenticated: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  originalPrice,
  period,
  features,
  subscriptionOptions,
  popular = false,
  delay = 0,
  isAuthenticated,
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
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-bold text-primary">{price}</span>
              <div className="flex flex-col">
                {originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {originalPrice}
                  </span>
                )}
                <span className="text-muted-foreground">/{period}</span>
              </div>
            </div>
          </div>
        </div>

        {subscriptionOptions && (
          <div className="border-t pt-4 ">
            <p className="text-sm text-muted-foreground text-center mb-3">
              + Optional Premium Features:
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Monthly:</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground line-through text-xs">
                    {subscriptionOptions.monthly.originalPrice}
                  </span>
                  <span className="font-semibold text-primary">
                    {subscriptionOptions.monthly.price}/mo
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Annual:</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground line-through text-xs">
                    {subscriptionOptions.annual.originalPrice}
                  </span>
                  <span className="font-semibold text-primary">
                    {subscriptionOptions.annual.price}/yr
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        <Link
          href={`${isAuthenticated ? "/manage-vcard" : "/auth/register"}`}
          className={`w-full block text-center py-2 rounded-md ${
            popular
              ? "bg-primary text-white hover:bg-primary/80"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        >
          Get Started
        </Link>
      </div>
    </Card>
  </motion.div>
);

export default function About() {
  const { authToken, isLoadingCookies } = useAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    if (authToken) {
      setIsAuthenticated(true);
    }
  }, [authToken]);

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
      title: "Digital Card",
      price: "Free",
      period: "forever",
      features: [
        "Digital Business Card",
        "Instant Sharing",
        "Contact Information",
        "Social Media Links",
        "Basic Analytics",
        "Email Support",
        "Mobile App Access",
        "White-label Solution",
      ],
      //   subscriptionOptions: {
      //     monthly: { price: "$3", originalPrice: "$4.99" },
      //     annual: { price: "$29", originalPrice: "$59" },
      //   },
      popular: true,
    },
    {
      title: "Plastic Card",
      price: "$19",
      period: "one-time",
      features: [
        "Physical Plastic Card",
        "NFC Technology",
        "Instant Tap Sharing",
        "Durable Material",
        "Custom Design",
      ],
      subscriptionOptions: {
        monthly: { price: "$3", originalPrice: "$4.99" },
        annual: { price: "$29", originalPrice: "$59" },
      },
    },
    {
      title: "Wooden Card",
      price: "$29",
      period: "one-time",
      features: [
        "Premium Wooden Card",
        "NFC Technology",
        "Eco-Friendly Material",
        "Elegant Finish",
        "Sustainable Choice",
      ],
      subscriptionOptions: {
        monthly: { price: "$3", originalPrice: "$4.99" },
        annual: { price: "$29", originalPrice: "$59" },
      },
    },
    {
      title: "Metal Card",
      price: "$49",
      period: "one-time",
      features: [
        "Premium Metal Card",
        "NFC Technology",
        "Luxury Feel",
        "Scratch Resistant",
        "Professional Look",
      ],
      subscriptionOptions: {
        monthly: { price: "$3", originalPrice: "$4.99" },
        annual: { price: "$29", originalPrice: "$59" },
      },
    },
  ];

  return (
    <section className="">
      <nav className="fixed top-0 left-0  right-0 z-50   py-3 bg-white border-b px-4 ">
        <div className="container mx-auto flex justify-between items-center">


        <div className="flex items-center gap-8 ">
          <TempLogo />
          <div className="hidden md:flex items-center gap-6">
            {/* <Link href="#features" className="text-sm text-gray-600 hover:text-primary">Features</Link> */}
            {/* <Link href="#pricing" className="text-sm text-gray-600 hover:text-primary">Pricing</Link> */}
            {/* <Link href="#product" className="text-sm text-gray-600 hover:text-primary">Product</Link> */}
            {/* <Link href="#more" className="text-sm text-gray-600 hover:text-primary">More</Link> */}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isLoadingCookies && (
            <>
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-primary"
                  >
                    Login
                  </Link>

                </>
              ) : (
                <Link
                  href="/manage-vcard"
                  className="text-sm text-gray-600 hover:text-primary"
                >
                VCard
                </Link>
              )}
            </>
          )}
            <Link
                    href="https://www.delightloop.com/bookademo"
                    className="text-sm text-gray-600 hover:text-primary"
                  >
                    Contact
                  </Link>
                  <Link
                    href="#pricing"
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
                  >
                    Buy
                  </Link>
        </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
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
                  Share your contact information instantly with a tap. No more
                  paper cards, no more lost connections. Join thousands of
                  professionals who've made the switch.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`${isAuthenticated ? "/manage-vcard" : "/auth/register"}`}
                  className="bg-primary flex items-center justify-center gap-1  py-2.5 rounded-md px-6 text-white hover:bg-primary/80"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  href="https://www.delightloop.com/bookademo"
                  className="border hover:text-white border-primary flex items-center justify-center gap-1  py-2.5 rounded-md px-6 text-primary hover:bg-primary"
                >

                  <Calendar className="w-4 h-4 mr-2" />
                  Book A Demo
                </Link>
              </div>

              <div className="flex items-center space-x-8 pt-4 justify-center sm:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground">
                    Active Users
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">1M+</div>
                  <div className="text-sm text-muted-foreground">
                    Cards Shared
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">99%</div>
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
                        <span className="text-white font-bold text-xl">JD</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          John Doe
                        </h3>
                        <p className="text-primary">Senior Sales Manager</p>
                        <p className="text-muted-foreground">
                          TechCorp Solutions
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
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
              Experience the future of networking with features designed for
              modern professionals
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 hidden">
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
              See what our customers are saying about their networking success
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
      <section
        id="pricing"
        className="py-16  px-4 sm:px-6 lg:px-8 bg-purple-50/50"
      >
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
              Choose your card type and optionally add premium features with our
              discounted subscription plans.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <PricingCard
                key={index}
                title={plan.title}
                price={plan.price}
                period={plan.period}
                features={plan.features}
                subscriptionOptions={plan.subscriptionOptions}
                popular={plan.popular}
                delay={index * 0.1}
                isAuthenticated={isAuthenticated}
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
              Join thousands of professionals who've already made the switch to
              digital business cards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
                  href={`${isAuthenticated ? "/manage-vcard" : "/auth/register"}`}
                  className="bg-primary flex items-center justify-center gap-1  py-2 rounded-md px-6 text-white hover:bg-primary/80"
                >
                Start Your Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                  href="https://www.delightloop.com/bookademo"
                  className="border hover:text-white border-primary flex items-center justify-center gap-1  py-2.5 rounded-md px-6 text-primary hover:bg-primary"
                >

                  <Calendar className="w-4 h-4 mr-2" />
                  Book A Demo
                </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center space-x-2">
              <TempLogo v2={true} />
              </div>
              <p className="text-purple-200 md:w-[60%]">
                The future of networking is here. Share your contact information
                instantly with digital business cards.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-purple-200">
                <li>
                  <Link
                    href="https://delightloop.com/"
                    className="hover:text-white transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.delightloop.com/bookademo"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-purple-200">
                <li>
                  <Link
                    href="https://www.delightloop.com/bookademo"
                    className="hover:text-white transition-colors"
                  >
                    Book a Meeting
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/40">
            <p>&copy; 2025 Delighto. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </section>
  );
}
