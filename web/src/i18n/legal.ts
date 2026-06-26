import type { Localized } from "./types";

/**
 * Structured, localized content for the legal pages (Privacy, Terms, Cookies).
 * Rendered generically by the shared LegalPage component.
 *
 * NOTE: Albanian (sq) and German (de) are machine-generated translations and
 * should be reviewed by a native speaker / legal counsel before production use.
 */

export type LegalBlock =
  | { kind: "h2"; text: Localized }
  | { kind: "p"; text: Localized }
  | { kind: "ul"; items: { label?: Localized; text: Localized }[] };

export interface LegalPageContent {
  title: Localized;
  updated: Localized;
  blocks: LegalBlock[];
}

export type LegalPageKey = "privacy" | "terms" | "cookie";

const updated: Localized = {
  en: "Last updated: October 2023",
  sq: "Përditësuar së fundi: Tetor 2023",
  de: "Zuletzt aktualisiert: Oktober 2023",
};

export const legalPages: Record<LegalPageKey, LegalPageContent> = {
  privacy: {
    title: { en: "Privacy Policy", sq: "Politika e privatësisë", de: "Datenschutzerklärung" },
    updated,
    blocks: [
      { kind: "h2", text: { en: "1. Introduction", sq: "1. Hyrje", de: "1. Einleitung" } },
      {
        kind: "p",
        text: {
          en: "At MADEM Real Estate, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.",
          sq: "Në MADEM Real Estate, ne e marrim seriozisht privatësinë tuaj. Kjo Politikë e Privatësisë shpjegon se si i mbledhim, përdorim, zbulojmë dhe mbrojmë të dhënat tuaja kur vizitoni faqen tonë ose përdorni shërbimet tona.",
          de: "Bei MADEM Real Estate nehmen wir Ihre Privatsphäre ernst. Diese Datenschutzerklärung erläutert, wie wir Ihre Daten erfassen, verwenden, weitergeben und schützen, wenn Sie unsere Website besuchen oder unsere Dienste nutzen.",
        },
      },
      { kind: "h2", text: { en: "2. Information We Collect", sq: "2. Të dhënat që mbledhim", de: "2. Welche Daten wir erfassen" } },
      {
        kind: "p",
        text: {
          en: "We may collect information about you in a variety of ways. The information we may collect via the Website includes:",
          sq: "Ne mund të mbledhim të dhëna për ju në mënyra të ndryshme. Të dhënat që mund të mbledhim përmes faqes përfshijnë:",
          de: "Wir können auf verschiedene Weise Daten über Sie erfassen. Zu den Daten, die wir über die Website erfassen können, gehören:",
        },
      },
      {
        kind: "ul",
        items: [
          {
            label: { en: "Personal Data:", sq: "Të dhëna personale:", de: "Personenbezogene Daten:" },
            text: {
              en: "Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information.",
              sq: "Informacion që ju identifikon personalisht, si emri, adresa, adresa e email-it dhe numri i telefonit, si dhe të dhëna demografike.",
              de: "Personenbezogene Informationen wie Ihr Name, Ihre Anschrift, E-Mail-Adresse und Telefonnummer sowie demografische Daten.",
            },
          },
          {
            label: { en: "Derivative Data:", sq: "Të dhëna derivative:", de: "Abgeleitete Daten:" },
            text: {
              en: "Information our servers automatically collect when you access the Website, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Website.",
              sq: "Informacion që serverët tanë e mbledhin automatikisht kur qaseni në faqe, si adresa juaj IP, lloji i shfletuesit, sistemi operativ, koha e qasjes dhe faqet që keni shikuar para dhe pas qasjes në faqe.",
              de: "Informationen, die unsere Server automatisch erfassen, wenn Sie auf die Website zugreifen, wie Ihre IP-Adresse, Ihr Browsertyp, Ihr Betriebssystem, Ihre Zugriffszeiten und die Seiten, die Sie unmittelbar vor und nach dem Zugriff angesehen haben.",
            },
          },
        ],
      },
      { kind: "h2", text: { en: "3. Use of Your Information", sq: "3. Përdorimi i të dhënave tuaja", de: "3. Verwendung Ihrer Daten" } },
      {
        kind: "p",
        text: {
          en: "Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you to:",
          sq: "Të dhënat e sakta për ju na mundësojnë t'ju ofrojmë një përvojë të rrjedhshme, efikase dhe të personalizuar. Konkretisht, mund t'i përdorim të dhënat e mbledhura për të:",
          de: "Genaue Daten über Sie ermöglichen es uns, Ihnen ein reibungsloses, effizientes und individuelles Erlebnis zu bieten. Konkret können wir die über Sie erfassten Daten verwenden, um:",
        },
      },
      {
        kind: "ul",
        items: [
          { text: { en: "Create and manage your account.", sq: "Krijuar dhe menaxhuar llogarinë tuaj.", de: "Ihr Konto zu erstellen und zu verwalten." } },
          { text: { en: "Process your requests for property viewings or listings.", sq: "Përpunuar kërkesat tuaja për vizita ose listime pronash.", de: "Ihre Anfragen für Besichtigungen oder Angebote zu bearbeiten." } },
          { text: { en: "Send you targeted marketing and promotional offers.", sq: "Dërguar oferta të targetuara marketingu dhe promocionale.", de: "Ihnen gezielte Marketing- und Werbeangebote zu senden." } },
          { text: { en: "Respond to customer service requests.", sq: "Përgjigjur kërkesave të shërbimit ndaj klientit.", de: "Auf Kundendienstanfragen zu reagieren." } },
        ],
      },
      { kind: "h2", text: { en: "4. Disclosure of Your Information", sq: "4. Zbulimi i të dhënave tuaja", de: "4. Weitergabe Ihrer Daten" } },
      {
        kind: "p",
        text: {
          en: "We may share information we have collected about you in certain situations. Your information may be disclosed as follows:",
          sq: "Në situata të caktuara mund t'i ndajmë të dhënat që kemi mbledhur për ju. Të dhënat tuaja mund të zbulohen si më poshtë:",
          de: "In bestimmten Situationen können wir die über Sie erfassten Daten weitergeben. Ihre Daten können wie folgt offengelegt werden:",
        },
      },
      {
        kind: "ul",
        items: [
          { text: { en: "By Law or to Protect Rights", sq: "Sipas ligjit ose për të mbrojtur të drejtat", de: "Aufgrund gesetzlicher Vorgaben oder zum Schutz von Rechten" } },
          { text: { en: "Third-Party Service Providers", sq: "Ofrues të palëve të treta", de: "Drittanbieter von Dienstleistungen" } },
          { text: { en: "Marketing Communications", sq: "Komunikime marketingu", de: "Marketing-Kommunikation" } },
        ],
      },
      { kind: "h2", text: { en: "5. Contact Us", sq: "5. Na kontaktoni", de: "5. Kontaktieren Sie uns" } },
      {
        kind: "p",
        text: {
          en: "If you have questions or comments about this Privacy Policy, please contact us at:",
          sq: "Nëse keni pyetje ose komente për këtë Politikë të Privatësisë, ju lutemi na kontaktoni në:",
          de: "Wenn Sie Fragen oder Anmerkungen zu dieser Datenschutzerklärung haben, kontaktieren Sie uns bitte unter:",
        },
      },
      {
        kind: "p",
        text: {
          en: "MADEM Real Estate\nMother Teresa Boulevard, No. 45\nPrishtine, Kosovo\nEmail: privacy@madem.com",
          sq: "MADEM Real Estate\nBulevardi Nënë Tereza, Nr. 45\nPrishtinë, Kosovë\nEmail: privacy@madem.com",
          de: "MADEM Real Estate\nMother-Teresa-Boulevard, Nr. 45\nPrishtina, Kosovo\nE-Mail: privacy@madem.com",
        },
      },
    ],
  },
  terms: {
    title: { en: "Terms of Service", sq: "Kushtet e shërbimit", de: "Nutzungsbedingungen" },
    updated,
    blocks: [
      { kind: "h2", text: { en: "1. Agreement to Terms", sq: "1. Pranimi i kushteve", de: "1. Zustimmung zu den Bedingungen" } },
      {
        kind: "p",
        text: {
          en: "By viewing or using this website, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our website or services.",
          sq: "Duke parë ose përdorur këtë faqe, ju pranoni të jeni të lidhur me këto Kushte të Shërbimit. Nëse nuk pajtoheni me ndonjë pjesë të këtyre kushteve, nuk duhet ta përdorni faqen ose shërbimet tona.",
          de: "Durch das Ansehen oder die Nutzung dieser Website erklären Sie sich mit diesen Nutzungsbedingungen einverstanden. Wenn Sie mit einem Teil dieser Bedingungen nicht einverstanden sind, dürfen Sie unsere Website oder Dienste nicht nutzen.",
        },
      },
      { kind: "h2", text: { en: "2. Agency Services", sq: "2. Shërbimet e agjencisë", de: "2. Agenturdienstleistungen" } },
      {
        kind: "p",
        text: {
          en: "MADEM Real Estate acts as a broker for buyers, sellers, landlords, and tenants of premium real estate properties. Any information provided on the website regarding properties is subject to change without notice and does not constitute a legally binding offer until a formal contract is executed.",
          sq: "MADEM Real Estate vepron si ndërmjetës për blerës, shitës, qiradhënës dhe qiramarrës të pronave premium. Çdo informacion i ofruar në faqe lidhur me pronat mund të ndryshojë pa njoftim paraprak dhe nuk përbën një ofertë ligjërisht të detyrueshme derisa të nënshkruhet një kontratë formale.",
          de: "MADEM Real Estate fungiert als Makler für Käufer, Verkäufer, Vermieter und Mieter von Premium-Immobilien. Alle auf der Website bereitgestellten Informationen zu Immobilien können ohne Vorankündigung geändert werden und stellen kein rechtsverbindliches Angebot dar, bis ein förmlicher Vertrag geschlossen wird.",
        },
      },
      { kind: "h2", text: { en: "3. Intellectual Property Rights", sq: "3. Të drejtat e pronësisë intelektuale", de: "3. Rechte an geistigem Eigentum" } },
      {
        kind: "p",
        text: {
          en: 'Unless otherwise indicated, the website is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the website (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us.',
          sq: 'Përveçse kur tregohet ndryshe, faqja është pronë e jona dhe i gjithë kodi burimor, bazat e të dhënave, funksionaliteti, softueri, dizajnet e faqes, audio, video, teksti, fotografitë dhe grafikat në faqe (së bashku, "Përmbajtja") si dhe markat tregtare, markat e shërbimit dhe logot e përfshira ("Markat") janë në pronësi ose nën kontrollin tonë ose të licencuara për ne.',
          de: 'Sofern nicht anders angegeben, ist die Website unser Eigentum, und sämtlicher Quellcode, Datenbanken, Funktionalitäten, Software, Website-Designs, Audio, Video, Texte, Fotografien und Grafiken auf der Website (zusammen der "Inhalt") sowie die darin enthaltenen Marken, Dienstleistungsmarken und Logos (die "Marken") sind unser Eigentum oder werden von uns kontrolliert oder an uns lizenziert.',
        },
      },
      { kind: "h2", text: { en: "4. User Representations", sq: "4. Deklaratat e përdoruesit", de: "4. Zusicherungen des Nutzers" } },
      {
        kind: "p",
        text: {
          en: "By using the website, you represent and warrant that:",
          sq: "Duke përdorur faqen, ju deklaroni dhe garantoni se:",
          de: "Durch die Nutzung der Website sichern Sie zu und gewährleisten, dass:",
        },
      },
      {
        kind: "ul",
        items: [
          { text: { en: "All registration information you submit will be true, accurate, current, and complete.", sq: "Të gjitha të dhënat e regjistrimit që dorëzoni do të jenë të vërteta, të sakta, aktuale dhe të plota.", de: "alle von Ihnen übermittelten Registrierungsdaten wahr, genau, aktuell und vollständig sind." } },
          { text: { en: "You will maintain the accuracy of such information and promptly update such registration information as necessary.", sq: "Ju do ta ruani saktësinë e këtyre të dhënave dhe do t'i përditësoni menjëherë sipas nevojës.", de: "Sie die Richtigkeit dieser Daten wahren und diese Registrierungsdaten bei Bedarf umgehend aktualisieren." } },
          { text: { en: "You have the legal capacity and you agree to comply with these Terms of Service.", sq: "Ju keni zotësinë juridike dhe pajtoheni t'i respektoni këto Kushte të Shërbimit.", de: "Sie über die Rechtsfähigkeit verfügen und sich verpflichten, diese Nutzungsbedingungen einzuhalten." } },
        ],
      },
      { kind: "h2", text: { en: "5. Limitation of Liability", sq: "5. Kufizimi i përgjegjësisë", de: "5. Haftungsbeschränkung" } },
      {
        kind: "p",
        text: {
          en: "In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the website.",
          sq: "Në asnjë rast ne, drejtorët, punonjësit ose agjentët tanë nuk do të jemi përgjegjës ndaj jush ose ndonjë pale të tretë për dëme të drejtpërdrejta, të tërthorta, pasuese, shembullore, rastësore, të veçanta ose ndëshkuese, përfshirë fitimin e humbur, të ardhurat e humbura, humbjen e të dhënave ose dëme të tjera që rrjedhin nga përdorimi i faqes.",
          de: "In keinem Fall haften wir oder unsere Geschäftsführer, Mitarbeiter oder Vertreter Ihnen gegenüber oder gegenüber Dritten für direkte, indirekte, Folge-, exemplarische, beiläufige, besondere oder Strafschadenersatzansprüche, einschließlich entgangenen Gewinns, entgangener Einnahmen, Datenverlust oder sonstiger Schäden, die sich aus Ihrer Nutzung der Website ergeben.",
        },
      },
    ],
  },
  cookie: {
    title: { en: "Cookie Policy", sq: "Politika e cookie-ve", de: "Cookie-Richtlinie" },
    updated,
    blocks: [
      { kind: "h2", text: { en: "1. What Are Cookies", sq: "1. Çfarë janë cookie-t", de: "1. Was sind Cookies" } },
      {
        kind: "p",
        text: {
          en: "Cookies are small text files that are placed on your computer or mobile device by websites that you visit. They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.",
          sq: "Cookie-t janë skedarë të vegjël tekstualë që vendosen në kompjuterin ose pajisjen tuaj celulare nga faqet që vizitoni. Ato përdoren gjerësisht për t'i bërë faqet të funksionojnë, ose të funksionojnë më efikasisht, si dhe për t'u ofruar informacion pronarëve të faqes.",
          de: "Cookies sind kleine Textdateien, die von den von Ihnen besuchten Websites auf Ihrem Computer oder Mobilgerät abgelegt werden. Sie werden häufig verwendet, damit Websites funktionieren oder effizienter arbeiten, sowie um den Betreibern der Website Informationen bereitzustellen.",
        },
      },
      { kind: "h2", text: { en: "2. How We Use Cookies", sq: "2. Si i përdorim cookie-t", de: "2. Wie wir Cookies verwenden" } },
      {
        kind: "p",
        text: {
          en: "MADEM Real Estate uses cookies for several reasons:",
          sq: "MADEM Real Estate i përdor cookie-t për disa arsye:",
          de: "MADEM Real Estate verwendet Cookies aus mehreren Gründen:",
        },
      },
      {
        kind: "ul",
        items: [
          {
            label: { en: "Essential Cookies:", sq: "Cookie thelbësore:", de: "Notwendige Cookies:" },
            text: {
              en: "These are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website.",
              sq: "Këto janë të nevojshme për funksionimin e faqes sonë. Ato përfshijnë, për shembull, cookie që ju mundësojnë të kyçeni në zonat e sigurta të faqes.",
              de: "Diese sind für den Betrieb unserer Website erforderlich. Dazu gehören beispielsweise Cookies, die es Ihnen ermöglichen, sich in sichere Bereiche unserer Website einzuloggen.",
            },
          },
          {
            label: { en: "Analytical/Performance Cookies:", sq: "Cookie analitike/të performancës:", de: "Analyse-/Leistungs-Cookies:" },
            text: {
              en: "They allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it.",
              sq: "Ato na lejojnë të njohim dhe numërojmë vizitorët dhe të shohim se si vizitorët lëvizin nëpër faqe gjatë përdorimit të saj.",
              de: "Sie ermöglichen es uns, die Anzahl der Besucher zu erkennen und zu zählen und zu sehen, wie sich Besucher auf unserer Website bewegen, während sie diese nutzen.",
            },
          },
          {
            label: { en: "Functionality Cookies:", sq: "Cookie funksionale:", de: "Funktions-Cookies:" },
            text: {
              en: "These are used to recognize you when you return to our website (such as remembering your saved favorite properties).",
              sq: "Këto përdoren për t'ju njohur kur ktheheni në faqen tonë (si p.sh. ruajtja e pronave tuaja të preferuara).",
              de: "Diese werden verwendet, um Sie zu erkennen, wenn Sie auf unsere Website zurückkehren (z. B. um Ihre gespeicherten Lieblingsimmobilien zu merken).",
            },
          },
        ],
      },
      { kind: "h2", text: { en: "3. Managing Cookies", sq: "3. Menaxhimi i cookie-ve", de: "3. Cookies verwalten" } },
      {
        kind: "p",
        text: {
          en: "Most web browsers allow you to manage cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit www.aboutcookies.org.",
          sq: "Shumica e shfletuesve ju lejojnë t'i menaxhoni cookie-t përmes cilësimeve të shfletuesit. Për të mësuar më shumë rreth cookie-ve, përfshirë si t'i shihni cookie-t e vendosura, vizitoni www.aboutcookies.org.",
          de: "Die meisten Webbrowser ermöglichen es Ihnen, Cookies über die Browsereinstellungen zu verwalten. Um mehr über Cookies zu erfahren, einschließlich wie Sie sehen können, welche Cookies gesetzt wurden, besuchen Sie www.aboutcookies.org.",
        },
      },
      {
        kind: "p",
        text: {
          en: "Please note that if you choose to disable cookies, it may limit your use of certain features or functions on our website, such as the favorites system.",
          sq: "Ju lutemi vini re se nëse zgjidhni t'i çaktivizoni cookie-t, kjo mund të kufizojë përdorimin e disa veçorive ose funksioneve në faqen tonë, si sistemi i të preferuarave.",
          de: "Bitte beachten Sie, dass das Deaktivieren von Cookies Ihre Nutzung bestimmter Funktionen unserer Website einschränken kann, etwa des Favoritensystems.",
        },
      },
    ],
  },
};
