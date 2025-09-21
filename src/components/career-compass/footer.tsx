
'use client';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t pt-10 mt-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          {/* Column 1: Logo and Social */}
          <div className="space-y-4">
             <div className="font-headline font-bold tracking-tight text-xl">
                <span className="text-foreground">Disha</span>
                <span className="text-primary">Darshak</span>
                <span className="text-foreground"> AI</span>
            </div>
            <p className="font-semibold">Connect with us</p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>
          
          {/* Column 2: About */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">About</h3>
            <a href="#" className="block text-muted-foreground hover:text-primary">About us</a>
            <a href="#" className="block text-muted-foreground hover:text-primary">Careers</a>
            <a href="#" className="block text-muted-foreground hover:text-primary">Employer home</a>
            <a href="#" className="block text-muted-foreground hover:text-primary">Sitemap</a>
          </div>

          {/* Column 3: Help */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Help center</h3>
            <a href="#" className="block text-muted-foreground hover:text-primary">Grievances</a>
            <a href="#" className="block text-muted-foreground hover:text-primary">Report issue</a>
          </div>

          {/* Column 4: Legal */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Policy</h3>
            <a href="#" className="block text-muted-foreground hover:text-primary">Privacy policy</a>
            <a href="#" className="block text-muted-foreground hover:text-primary">Terms & conditions</a>
            <a href="#" className="block text-muted-foreground hover:text-primary">Fraud alert</a>
            <a href="#" className="block text-muted-foreground hover:text-primary">Trust & safety</a>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground mt-10 py-4 border-t">
          © {new Date().getFullYear()} DishaDarshak AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
