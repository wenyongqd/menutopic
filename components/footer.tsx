"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-bg-100 border-t border-bg-300 mt-auto">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl py-6">
        {/* <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-text-200">
              Powered by{" "}
              <a
                href="https://togetherai.link/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-100 hover:text-primary-200 transition-colors underline-offset-4 underline"
              >
                Together AI
              </a>
              . Created by{" "}
              <a
                href="https://twitter.com/nutlope"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-100 hover:text-primary-200 transition-colors underline-offset-4 underline"
              >
                Hassan
              </a>
              .
            </p>
          </div>
          <div className="flex space-x-4">
            <a
              href="https://github.com/Nutlope/MenuToPic"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-200 hover:text-primary-100 transition-colors"
            >
              <FaGithub className="h-6 w-6" />
              <span className="sr-only">GitHub</span>
            </a>
            <a
              href="https://twitter.com/nutlope"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-200 hover:text-primary-100 transition-colors"
            >
              <FaTwitter className="h-6 w-6" />
              <span className="sr-only">Twitter</span>
            </a>
            <a
              href="https://linkedin.com/in/nutlope"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-200 hover:text-primary-100 transition-colors"
            >
              <FaLinkedin className="h-6 w-6" />
              <span className="sr-only">LinkedIn</span>
            </a>
          </div>
        </div> */}
        <div className="mt-6 text-center text-sm text-text-200">
          <div className="flex justify-center space-x-4">
            <Link href="#features" className="hover:text-primary-100">Features</Link>
            <Link href="#how-it-works" className="hover:text-primary-100">How It Works</Link>
            <Link href="#faq" className="hover:text-primary-100">FAQ</Link>
          </div>
          <p className="mt-4">© {new Date().getFullYear()} MenuToPic. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
