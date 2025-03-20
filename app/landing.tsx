"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  Star,
  ChevronRight,
  Mail
} from "lucide-react";
import { useEffect, useState } from "react";
import { MenuImageGallery } from "@/components/menu-image-gallery";

// Sample data for testimonials section
const testimonials = [
  {
    content: "MenuToPic has completely changed how I order at restaurants. Being able to see dishes before ordering helps me make better choices.",
    name: "Sarah Johnson",
    title: "Food Enthusiast",
    rating: 5
  },
  {
    content: "As someone who travels frequently, this tool is invaluable for navigating unfamiliar menus in different countries.",
    name: "Michael Chen",
    title: "Travel Blogger",
    rating: 5
  },
  {
    content: "The ability to search through menu items and see what they look like has saved me from many ordering mistakes!",
    name: "Emma Rodriguez",
    title: "Restaurant Reviewer",
    rating: 4
  }
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    setIsLoaded(true);
  }, []);

  // 在客户端渲染之前返回一个加载状态或空白内容
  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-gradient-to-b from-bg-100 to-white">
      <main>
        {/* Hero Section */}
        <section className="w-full py-20 md:py-28 lg:py-36 xl:py-40 overflow-hidden relative">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-100/15 blur-3xl transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className={`absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-accent-200/25 blur-3xl transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className={`absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-primary-300/10 blur-3xl transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}></div>
          </div>
          
          <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
            <div className="grid gap-12 lg:grid-cols-[1fr_550px] lg:gap-16 xl:grid-cols-[1fr_650px] items-center">
              <div className="flex flex-col justify-center space-y-8">
                <div className={`inline-flex items-center px-4 py-1.5 rounded-full bg-primary-100/10 text-primary-100 text-sm font-medium mb-2 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <span className="flex h-2 w-2 rounded-full bg-primary-100 mr-2 animate-pulse"></span>
                  AI-Powered Menu Visualization
                </div>
                <div className="space-y-6">
                  <h1 className={`text-5xl font-bold tracking-tight text-text-100 sm:text-6xl xl:text-7xl transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <span className="block">Visualize Your Menu</span>
                    <span className="block text-primary-100 mt-2">With Stunning AI Images</span>
                  </h1>
                  <p className={`max-w-[600px] text-text-200 md:text-xl leading-relaxed transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    Take a picture of any menu and instantly get beautiful AI-generated images of each dish to help you decide what to order.
                  </p>
                </div>
                <div className={`flex flex-col sm:flex-row gap-5 mt-4 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <Link 
                    href="/dashboard" 
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-100 px-8 py-4 text-base font-medium text-white hover:bg-primary-200 transition-all shadow-lg hover:shadow-xl hover:shadow-primary-100/20 hover:translate-y-[-2px]"
                  >
                    Get Started <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                  <Link 
                    href="#how-it-works" 
                    className="inline-flex items-center justify-center rounded-full border-2 border-bg-300 bg-transparent px-8 py-4 text-base font-medium text-text-100 hover:bg-bg-200 transition-all hover:border-primary-100/50"
                  >
                    Learn More <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
                <div className={`flex items-center gap-3 mt-6 text-sm text-text-200 transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-bg-200 flex items-center justify-center text-xs font-medium shadow-sm">
                        {i}
                      </div>
                    ))}
                  </div>
                  <span>Join <span className="font-medium text-primary-100">1,000+</span> users visualizing menus</span>
                </div>
              </div>
              <div className={`relative mx-auto lg:order-last transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0 translate-y-8 translate-x-8'}`}>
                <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary-100/20 to-accent-200/20 rounded-2xl blur-xl transform rotate-3"></div>
                <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-bg-300/50 group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-100/10 to-accent-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                  <Image
                    src="/menu-demo.jpeg"
                    width={800}
                    height={550}
                    alt="Menu visualization demo"
                    className="object-cover object-center w-full h-full transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/800x550/e2e8f0/64748b?text=MenuToPic+Demo";
                    }}
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary-100/10 rounded-full blur-xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-28 lg:py-32 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-bg-100/50 via-bg-200/30 to-white"></div>
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent"></div>
          <div className="absolute left-0 top-1/4 w-64 h-64 rounded-full bg-primary-100/5 blur-3xl"></div>
          <div className="absolute right-0 bottom-1/4 w-64 h-64 rounded-full bg-accent-200/10 blur-3xl"></div>
          
          <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-100/10 text-primary-100 text-sm font-medium mb-4">
                <span className="flex h-2 w-2 rounded-full bg-primary-100 mr-2"></span>
                Menu Visualization
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-text-100 md:text-5xl lg:text-6xl max-w-3xl">
                Transform Your Menu Into <span className="text-primary-100">Visual Delights</span>
              </h2>
              <p className="mx-auto max-w-[700px] text-text-200 md:text-xl mt-6">
                See how our AI transforms menu items into beautiful, appetizing visuals that help you make informed dining decisions.
              </p>
            </div>
            
            <MenuImageGallery />
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-20 md:py-28 lg:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-bg-100/30 to-white"></div>
          <div className="absolute left-1/4 top-1/3 w-64 h-64 rounded-full bg-primary-100/5 blur-3xl"></div>
          <div className="absolute right-1/4 bottom-1/3 w-64 h-64 rounded-full bg-accent-200/10 blur-3xl"></div>
          
          <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-20">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-100/10 text-primary-100 text-sm font-medium mb-4">
                <span className="flex h-2 w-2 rounded-full bg-primary-100 mr-2"></span>
                Simple Process
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-text-100 md:text-5xl lg:text-6xl max-w-3xl">
                How <span className="text-primary-100">MenuToPic</span> Works
              </h2>
              <p className="mx-auto max-w-[700px] text-text-200 md:text-xl mt-6">
                Our simple three-step process transforms any menu into a visual feast in seconds.
              </p>
            </div>
            
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-100/30 to-transparent hidden lg:block"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
                {[
                  {
                    step: 1,
                    title: "Upload Menu",
                    description: "Take a photo of any menu or upload an existing image from your device.",
                    image: "/menu-upload.jpeg"
                  },
                  {
                    step: 2,
                    title: "AI Processing",
                    description: "Our AI analyzes the menu, identifies dishes, and generates visual representations.",
                    isProcessing: true
                  },
                  {
                    step: 3,
                    title: "Explore & Download",
                    description: "Browse the visual menu, search for specific dishes, and download images as needed.",
                    image: "/menu-result.jpeg"
                  }
                ].map((item, index) => (
                  <div key={index} className="relative flex flex-col items-center group">
                    <div className="relative z-20 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-white shadow-lg mb-10 group-hover:scale-110 transition-transform duration-300">
                      {item.step}
                      <div className="absolute -inset-4 rounded-full border-2 border-dashed border-primary-100/30 animate-[spin_30s_linear_infinite]"></div>
                      <div className="absolute -inset-6 rounded-full border border-primary-100/20 group-hover:border-primary-100/40 transition-colors duration-300"></div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-bg-300/20 w-full h-full flex flex-col group-hover:shadow-xl group-hover:border-primary-100/30 transition-all duration-300 group-hover:translate-y-[-5px]">
                      <h3 className="text-2xl font-bold text-text-100 mb-4 group-hover:text-primary-100 transition-colors">{item.title}</h3>
                      <p className="text-text-200 mb-8 flex-grow group-hover:text-text-100 transition-colors">{item.description}</p>
                      
                      <div className="rounded-xl bg-bg-200/30 p-4 overflow-hidden h-56 w-full flex items-center justify-center group-hover:bg-bg-200/50 transition-colors duration-300">
                        {item.isProcessing ? (
                          <div className="relative flex flex-col items-center">
                            <div className="relative h-24 w-24">
                              {/* 外部旋转环 */}
                              <div className="absolute inset-0 rounded-full border-4 border-bg-300/20"></div>
                              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-100 animate-spin" style={{ animationDuration: '2s' }}></div>
                              <div className="absolute inset-0 rounded-full border-4 border-transparent border-b-accent-200/70 animate-spin" style={{ animationDuration: '4s' }}></div>
                              
                              {/* 中心AI图标 */}
                              <div className="absolute inset-3 rounded-full bg-white shadow-sm flex items-center justify-center">
                                <div className="h-10 w-10 text-primary-100">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 2c1.5 0 3 1.5 3 3 0 .4-.1.8-.3 1.1.4.2.7.4 1 .7.7-.3 1.5-.5 2.3-.5 1.5 0 3 1.5 3 3s-1.5 3-3 3c-.4 0-.8-.1-1.1-.3-.2.4-.4.7-.7 1 .3.7.5 1.5.5 2.3 0 1.5-1.5 3-3 3s-3-1.5-3-3c0-.4.1-.8.3-1.1-.4-.2-.7-.4-1-.7-.7.3-1.5.5-2.3.5-1.5 0-3-1.5-3-3s1.5-3 3-3c.4 0 .8.1 1.1.3.2-.4.4-.7.7-1-.3-.7-.5-1.5-.5-2.3 0-1.5 1.5-3 3-3z" strokeLinecap="round" strokeLinejoin="round"/>
                                    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                              </div>
                              
                              {/* 脉冲效果 */}
                              <div className="absolute -inset-3 rounded-full border border-primary-100/30 animate-ping" style={{ animationDuration: '3s' }}></div>
                            </div>
                            
                            {/* 数据流动效果 - 左侧 */}
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-16 flex flex-col items-center opacity-70">
                              <div className="h-1 w-12 bg-gradient-to-r from-transparent to-primary-100/50 animate-pulse"></div>
                              <div className="h-1 w-8 bg-gradient-to-r from-transparent to-primary-100/50 animate-pulse mt-2" style={{ animationDelay: '0.3s' }}></div>
                              <div className="h-1 w-10 bg-gradient-to-r from-transparent to-primary-100/50 animate-pulse mt-2" style={{ animationDelay: '0.6s' }}></div>
                            </div>
                            
                            {/* 数据流动效果 - 右侧 */}
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-16 flex flex-col items-center opacity-70">
                              <div className="h-1 w-12 bg-gradient-to-l from-transparent to-accent-200/50 animate-pulse"></div>
                              <div className="h-1 w-8 bg-gradient-to-l from-transparent to-accent-200/50 animate-pulse mt-2" style={{ animationDelay: '0.4s' }}></div>
                              <div className="h-1 w-10 bg-gradient-to-l from-transparent to-accent-200/50 animate-pulse mt-2" style={{ animationDelay: '0.7s' }}></div>
                            </div>
                            
                            <div className="mt-8 text-center">
                              <div className="text-primary-100 font-medium text-lg">AI Processing</div>
                              <div className="text-text-200 text-sm mt-1">Analyzing menu and generating images</div>
                              <div className="flex justify-center space-x-1 mt-2">
                                <span className="h-1.5 w-1.5 bg-primary-100 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="h-1.5 w-1.5 bg-primary-100 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="h-1.5 w-1.5 bg-primary-100 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full overflow-hidden rounded-lg group-hover:scale-[1.02] transition-transform duration-500">
                            <Image 
                              src={item.image || ""} 
                              alt={item.title} 
                              width={400} 
                              height={300}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/400x300/e2e8f0/64748b?text=" + item.title;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-20 md:py-28 lg:py-32 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-bg-100/50 via-bg-200/30 to-white"></div>
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent"></div>
          <div className="absolute -left-64 top-1/4 w-96 h-96 rounded-full bg-primary-100/10 blur-3xl"></div>
          <div className="absolute -right-64 bottom-1/4 w-96 h-96 rounded-full bg-accent-200/20 blur-3xl"></div>
          
          <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-20">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-100/10 text-primary-100 text-sm font-medium mb-4">
                <span className="flex h-2 w-2 rounded-full bg-primary-100 mr-2"></span>
                User Testimonials
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-text-100 md:text-5xl lg:text-6xl max-w-3xl">
                What Our <span className="text-primary-100">Users</span> Say
              </h2>
              <p className="mx-auto max-w-[700px] text-text-200 md:text-xl mt-6">
                Don&apos;t just take our word for it. Here&apos;s what people who use MenuToPic have to say.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-lg border border-bg-300/20 flex flex-col relative overflow-hidden group hover:shadow-xl hover:border-primary-100/30 transition-all duration-300 hover:translate-y-[-5px]"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary-100/5 rounded-full -mr-20 -mt-20 group-hover:bg-primary-100/10 transition-all duration-300"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-200/5 rounded-full -ml-10 -mb-10 group-hover:bg-accent-200/10 transition-all duration-300"></div>
                  
                  <div className="relative z-10">
                    <div className="flex mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-6 w-6 ${i < testimonial.rating ? "fill-primary-100 text-primary-100" : "fill-bg-300 text-bg-300"} ${i < testimonial.rating ? "group-hover:scale-110" : ""} transition-transform duration-300`}
                        />
                      ))}
                    </div>
                    
                    <div className="mb-8 flex-grow">
                      <p className="text-text-200 italic text-lg leading-relaxed group-hover:text-text-100 transition-colors">&quot;{testimonial.content}&quot;</p>
                    </div>
                    
                    <div className="flex items-center space-x-4 pt-4 border-t border-bg-300/30">
                      <div className="h-14 w-14 rounded-full bg-primary-100/10 flex items-center justify-center text-primary-100 font-bold text-lg shadow-sm group-hover:bg-primary-100 group-hover:text-white transition-all duration-300">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-text-100 text-lg">{testimonial.name}</p>
                        <p className="text-sm text-text-200 group-hover:text-primary-100 transition-colors">{testimonial.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-20 md:py-28 lg:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-bg-100/20 to-white"></div>
          <div className="absolute left-0 top-1/3 w-64 h-64 rounded-full bg-primary-100/5 blur-3xl"></div>
          <div className="absolute right-0 bottom-1/3 w-64 h-64 rounded-full bg-accent-200/10 blur-3xl"></div>
          
          <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-20">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-100/10 text-primary-100 text-sm font-medium mb-4">
                <span className="flex h-2 w-2 rounded-full bg-primary-100 mr-2"></span>
                Common Questions
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-text-100 md:text-5xl lg:text-6xl max-w-3xl">
                Frequently Asked <span className="text-primary-100">Questions</span>
              </h2>
              <p className="mx-auto max-w-[700px] text-text-200 md:text-xl mt-6">
                Find answers to common questions about MenuToPic.
              </p>
            </div>
            
            <div className="mx-auto max-w-3xl space-y-6">
              {[
                {
                  question: "How accurate are the dish images?",
                  answer: "Our AI generates representative images based on dish names and descriptions. While they provide a good visual reference, they may not exactly match the actual dish at a specific restaurant."
                },
                {
                  question: "Can I use MenuToPic for any type of menu?",
                  answer: "Yes! MenuToPic works with restaurant menus, café menus, bar menus, and more. Our AI is trained to recognize a wide variety of food and beverage items."
                },
                {
                  question: "Is MenuToPic free to use?",
                  answer: "Yes, MenuToPic is completely free to use, powered by Together AI technology."
                },
                {
                  question: "How do I download images?",
                  answer: "You can download individual dish images by clicking the download button on each item, or download all images at once using the 'Download All' button."
                },
                {
                  question: "Can I use MenuToPic on my mobile device?",
                  answer: "Absolutely! MenuToPic is fully responsive and works great on smartphones and tablets. You can take a photo directly with your device's camera."
                }
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="group bg-white rounded-2xl p-8 shadow-lg border border-bg-300/20 hover:border-primary-100/30 transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex items-center justify-between cursor-pointer">
                    <h3 className="text-xl font-bold text-text-100 group-hover:text-primary-100 transition-colors">{item.question}</h3>
                    <div className="h-10 w-10 rounded-full bg-bg-200/70 flex items-center justify-center group-hover:bg-primary-100/10 transition-all duration-300 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-200 group-hover:text-primary-100 transition-colors">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                  <div className="mt-6 text-text-200 group-hover:text-text-100 transition-colors leading-relaxed">
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-100 via-primary-200 to-primary-300"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/pattern.svg')] bg-repeat bg-center"></div>
          </div>
          <div className="absolute -left-24 top-1/3 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -right-24 bottom-1/3 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute left-1/2 top-0 w-64 h-64 rounded-full bg-white/5 blur-3xl transform -translate-x-1/2"></div>
          <div className="absolute left-1/2 bottom-0 w-64 h-64 rounded-full bg-white/5 blur-3xl transform -translate-x-1/2"></div>
          
          <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
            <div className="flex flex-col items-center justify-center space-y-10 text-center">
              <div className="space-y-6 max-w-3xl">
                <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                  Ready to Visualize Your Menu?
                </h2>
                <p className="mx-auto max-w-[700px] text-white/90 md:text-xl lg:text-2xl leading-relaxed">
                  Transform any menu into a visual feast with just a photo. Try MenuToPic today!
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 mt-6">
                <Link 
                  href="/" 
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-medium text-primary-100 hover:bg-bg-100 transition-all shadow-lg hover:shadow-xl hover:shadow-black/10 hover:translate-y-[-2px]"
                >
                  Try It Now <ArrowRight className="h-5 w-5 ml-1" />
                </Link>
                <button
                  onClick={() => {
                    const emailConfig = {
                      to: "support@chatopsis.com",
                      subject: "MenuToPic Support Request",
                      body: "Please describe your issue:\n\n" +
                            "---------------------\n" +
                            "• What problem are you experiencing?\n" +
                            "• What were you trying to do?\n" +
                            "• Any error messages you saw?\n\n" +
                            "We'll get back to you within 24 hours.",
                    };

                    const mailtoLink = `mailto:${emailConfig.to}?subject=${encodeURIComponent(
                      emailConfig.subject
                    )}&body=${encodeURIComponent(emailConfig.body)}`;

                    window.location.href = mailtoLink;
                  }}
                  className="inline-flex items-center justify-center rounded-full border-2 border-white/40 bg-transparent px-8 py-4 text-lg font-medium text-white hover:bg-white/10 transition-all hover:border-white/60"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Us
                </button>
              </div>
              
              <div className="mt-12 flex flex-col items-center space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-primary-200 bg-white/20 flex items-center justify-center text-xs font-medium text-white shadow-lg">
                        {i}
                      </div>
                    ))}
                  </div>
                  <span className="text-white/90 text-lg">Join thousands of satisfied users</span>
                </div>
                <div className="flex items-center space-x-3 text-white/90 text-lg bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
                  <span>Powered by</span>
                  <a
                    href="https://togetherai.link/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-white hover:underline"
                  >
                    Together AI
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 