"use client";

import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Languages, ChevronDown, Check } from "lucide-react";

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pa-Guru', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'mwr', name: 'Marwadi', nativeName: 'मारवाड़ी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const currentLanguage =
    languages.find(lang => lang.code === locale) || languages[0];

  const handleChange = (newLocale: string) => {
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, '');
    const newPath = `/${newLocale}${pathnameWithoutLocale || ''}`;
    router.push(newPath);
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="flex items-center gap-1.5 sm:gap-2 bg-muted/50 hover:bg-muted/70 text-foreground border border-primary/30 hover:border-primary/60 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium cursor-pointer focus:border-primary focus:outline-none transition-all">
        <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
        <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="
            absolute left-0 mt-2 w-40 sm:w-48 origin-top-left
            bg-gray-100/80 dark:bg-black/80
            backdrop-blur-2xl
            drop-shadow-2xl
            rounded-lg
            ring-1 ring-primary/20
            focus:outline-none
            z-50
          "
        >
          <div className="py-1">
            {languages.map((language) => (
              <Menu.Item key={language.code}>
                {({ active }) => (
                  <button
                    onClick={() => handleChange(language.code)}
                    className={`${
                      active
                        ? 'bg-primary/20 text-primary'
                        : 'text-foreground'
                    } group flex cursor-pointer w-full items-center justify-between px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{language.nativeName}</span>
                    </span>
                    {locale === language.code && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
