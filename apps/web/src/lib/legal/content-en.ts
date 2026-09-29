import { LEGAL_ENTITY as E } from "./entity";
import type { LegalDocs } from "./types";

export const legalEn: LegalDocs = {
  notice: {
    title: "Legal notice",
    intro:
      "In accordance with article 1-1 of French law no. 2004-575 of 21 June 2004 on confidence in the digital economy (LCEN), the following information is provided to users of the Qdot website.",
    sections: [
      {
        id: "publisher",
        heading: "Publisher",
        body: [
          {
            list: [
              `Publisher: ${E.name}`,
              `Legal form: ${E.legalForm}`,
              `Registered office: ${E.address}`,
              `Registration: ${E.registration}`,
              `EU VAT number: ${E.vatNumber}`,
              `Email: ${E.email}`,
              `Phone: ${E.phone}`,
              `Website: ${E.websiteUrl}`,
            ],
          },
        ],
      },
      {
        id: "director",
        heading: "Publication director",
        body: [`${E.publicationDirector}, reachable at ${E.email}.`],
      },
      {
        id: "host",
        heading: "Hosting provider",
        body: [{ list: [`Host: ${E.host.name}`, `Address: ${E.host.address}`, `Phone: ${E.host.phone}`] }],
      },
      {
        id: "reporting",
        heading: "Reporting illegal content",
        body: [
          "QR codes created on Qdot redirect to addresses chosen by their creators. If a QR code leads to content you believe is illegal (phishing, malware, counterfeiting, hate speech…), report it by writing to " +
            `${E.abuseEmail}. This single point of contact is also intended for authorities (Regulation (EU) 2022/2065, "DSA", articles 11 and 12).`,
          "To be handled quickly, your report should include the QR code's address (short link), the nature of the content, why you consider it illegal, and your contact details. Abusive reports may engage their author's liability.",
        ],
      },
      {
        id: "ip",
        heading: "Intellectual property",
        body: [
          "Qdot's source code is released under the MIT License: you may use, modify and redistribute it under the terms of that license. The Qdot name, logo and visual identity remain the property of the publisher and may not be reproduced without permission.",
          "The content you create (QR code names, uploaded logos, destination addresses) remains yours.",
          "Approximate scan geolocation uses DB-IP's IP to City Lite database (https://db-ip.com), licensed under Creative Commons Attribution 4.0. The basemap uses Natural Earth data (public domain).",
        ],
      },
      {
        id: "liability",
        heading: "Liability",
        body: [
          "The publisher strives to keep published information accurate and the service available, without guaranteeing it. The publisher is not responsible for the content of websites that user-created QR codes redirect to.",
        ],
      },
      {
        id: "data",
        heading: "Personal data and cookies",
        body: [
          "How your personal data is processed is described in the privacy policy, and cookie use in the cookie policy, both linked at the bottom of every page.",
        ],
      },
      {
        id: "law",
        heading: "Governing law",
        body: ["This legal notice is governed by French law."],
      },
    ],
  },

  privacy: {
    title: "Privacy policy",
    intro:
      "This policy explains which personal data Qdot processes, why, for how long, and how to exercise your rights, in accordance with Regulation (EU) 2016/679 (GDPR) and the French Data Protection Act of 6 January 1978.",
    sections: [
      {
        id: "controller",
        heading: "Data controller",
        body: [
          `The data controller is ${E.name}, ${E.address}. For any question about your data: ${E.privacyEmail}.`,
          "Two situations must be distinguished:",
          {
            list: [
              "for your Qdot account data, the publisher is the controller;",
              "for a QR code's scan statistics, the account holder who created the code decides how they are used: they are the controller and the publisher acts as their processor (GDPR article 28), under the conditions set out in the terms of use.",
            ],
          },
        ],
      },
      {
        id: "account",
        heading: "Account holders' data",
        body: [
          {
            list: [
              "Data: email address, name, password (stored only as an Argon2id hash, never in plain text), account creation date, and the QR codes and campaigns you create (names, destination addresses, styles, logos).",
              "Purposes: creating and securing your account, providing the service (creating, editing and redirecting QR codes, analytics), contacting you about the service.",
              "Legal basis: performance of our contract, i.e. the terms of use (GDPR article 6.1.b).",
              "Retention: for the lifetime of the account. Deleting the account deletes its QR codes, campaigns and statistics. Sign-in sessions expire automatically after 30 days.",
            ],
          },
        ],
      },
      {
        id: "scans",
        heading: "Data of people who scan a QR code",
        body: [
          "When someone scans a Qdot QR code, their phone contacts our servers, which redirect it to the chosen destination. At that moment:",
          {
            list: [
              "the IP address is used only at scan time to derive an approximate location (country, region, city) from a database installed on our servers. The IP address is never stored;",
              "the browser sends a user-agent string, from which we derive the device type (mobile, tablet, desktop), operating system and browser;",
              "only the domain name of the referring site is kept, when one is sent;",
              "to count unique visitors, a pseudonymous identifier is computed from the IP address, the user-agent and a random value renewed every day and kept only in memory. It cannot be used to recover the IP address or to follow a person from one day to the next.",
            ],
          },
          "No cookie is placed on the scanning device, and no data is sold or used for advertising.",
          "Purpose: providing the QR code's creator with audience statistics. Legal basis: the QR code creator's legitimate interest in measuring the effectiveness of their materials (GDPR article 6.1.f), with limited impact on individuals given the safeguards above. Retention: as long as the QR code exists; scan events are deleted with it.",
          "You can object to this processing by contacting the QR code's creator or by writing to us: we will forward your request.",
        ],
      },
      {
        id: "browser",
        heading: "Data kept in your browser",
        body: [
          "The site uses a session cookie and a language preference cookie, as well as the browser's local storage (a QR code being created during sign-up, display preferences). These are strictly necessary for the service to work and are detailed in the cookie policy.",
        ],
      },
      {
        id: "recipients",
        heading: "Recipients and processors",
        body: [
          `Data is accessible only to authorized staff of the publisher and to its hosting provider, ${E.host.name}, acting as a processor. It is hosted in: ${E.host.location}.`,
          "No data is transferred outside the European Union. Should such a transfer become necessary, it would be covered by the safeguards of GDPR articles 44 et seq. (adequacy decision or standard contractual clauses).",
          "Data may be disclosed to authorities where required by law.",
        ],
      },
      {
        id: "security",
        heading: "Security",
        body: [
          "Traffic is encrypted (HTTPS), passwords are hashed with Argon2id, the session cookie is inaccessible to scripts (HttpOnly), and only a hash of the session token is stored in the database.",
        ],
      },
      {
        id: "rights",
        heading: "Your rights",
        body: [
          "You have the right to access, rectify, erase, restrict, port and object to the processing of your data, and to set instructions regarding your data after your death.",
          `To exercise them, write to ${E.privacyEmail} stating your account's email address. We reply within one month. We may ask for proof of identity if there is reasonable doubt.`,
          "If you believe your rights are not respected, you can lodge a complaint with the CNIL (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, France — www.cnil.fr) or with your local supervisory authority.",
        ],
      },
      {
        id: "minors",
        heading: "Minors",
        body: ["The service is intended for people aged 15 and over. Below that age, creating an account requires the consent of a holder of parental authority."],
      },
      {
        id: "changes",
        heading: "Changes",
        body: ["This policy may change. The last update date appears at the top of the page; account holders will be informed of significant changes."],
      },
    ],
  },

  terms: {
    title: "Terms of use",
    intro: "These terms of use govern access to and use of the Qdot service. Creating an account constitutes unreserved acceptance of these terms.",
    sections: [
      {
        id: "purpose",
        heading: "1. Purpose and service",
        body: [
          `Qdot, published by ${E.name}, lets you create customizable dynamic QR codes, change their destination after printing, and view scan statistics.`,
          "The service is provided free of charge. Should paid plans be offered, they would be governed by separate terms of sale, accepted before any order.",
        ],
      },
      {
        id: "account",
        heading: "2. Account",
        body: [
          "Using the service requires an account created with a valid email address and a password. You are responsible for keeping your credentials confidential and for all activity under your account. Notify us without delay of any unauthorized use.",
          "You must be at least 15 years old, or have the consent of a holder of parental authority.",
        ],
      },
      {
        id: "acceptable-use",
        heading: "3. Acceptable use",
        body: [
          "You alone are responsible for the destinations your QR codes redirect to. In particular, you may not use Qdot for:",
          {
            list: [
              "phishing, fraud, or fraudulent collection of credentials or payment details;",
              "distributing malware;",
              "illegal content: child sexual abuse material, terrorist content, incitement to hatred, counterfeiting, infringement of privacy or third-party rights;",
              "sending unsolicited communications (spam);",
              "any attempt to disrupt the service or circumvent its technical limits.",
            ],
          },
        ],
      },
      {
        id: "moderation",
        heading: "4. Reports and suspension",
        body: [
          `Illegal content can be reported to ${E.abuseEmail}. After review, the publisher may deactivate a QR code, or suspend or delete an account, for breach of these terms or at the request of an authority. Except in emergencies or where the law requires otherwise, you will be informed of the decision and its reasons, and may contest it by replying to the message you receive.`,
        ],
      },
      {
        id: "scan-data",
        heading: "5. Scan statistics and personal data",
        body: [
          "For your QR codes' scan statistics, you are the controller and the publisher acts as your processor, solely on your instructions as expressed through the service's features. The publisher undertakes to: process this data only to produce your statistics; keep it confidential and secure; use only sub-processors offering equivalent guarantees (currently its hosting provider); help you respond to data subject requests; notify you of any data breach without undue delay; delete this data when the QR code or account is deleted.",
          "It is your responsibility to inform people who scan your QR codes, for example with a notice on your printed materials or on the destination page. The data collected is detailed in the privacy policy.",
        ],
      },
      {
        id: "availability",
        heading: "6. Availability",
        body: [
          "The publisher uses reasonable means to provide access to the service and QR code redirection, without guaranteeing permanent availability. The service may be interrupted for maintenance, updates or force majeure. A paused, archived or deleted QR code no longer redirects.",
        ],
      },
      {
        id: "ip",
        heading: "7. Intellectual property",
        body: [
          "Qdot's source code is published under the MIT License. You retain all rights to the content you upload (logos, names) and grant the publisher a license limited to hosting and displaying it for the sole purpose of the service. You warrant that you hold the necessary rights to this content.",
        ],
      },
      {
        id: "liability",
        heading: "8. Liability",
        body: [
          "The service is provided \"as is\". The publisher is not liable for indirect damages, for the content of destination websites, or for a QR code made unreadable by a choice of colors or pattern. Nothing in these terms limits the publisher's liability for gross negligence or willful misconduct, nor your statutory rights as a consumer.",
        ],
      },
      {
        id: "term",
        heading: "9. Term and termination",
        body: [`These terms apply for as long as you use the service. You can delete your account at any time by writing to ${E.email}; your QR codes will then stop redirecting.`],
      },
      {
        id: "changes",
        heading: "10. Changes to these terms",
        body: [
          "The publisher may update these terms. Account holders are informed of significant changes at least 15 days before they take effect; continued use of the service constitutes acceptance of the new terms.",
        ],
      },
      {
        id: "law",
        heading: "11. Governing law and disputes",
        body: [
          "These terms are governed by French law. In the event of a dispute, an amicable solution will be sought before any legal action. Consumers may also use a consumer mediator free of charge (French Consumer Code, articles L. 611-1 et seq.) or the EU online dispute resolution platform. Failing agreement, the competent courts are those designated by ordinary rules of law.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie policy",
    intro:
      "A cookie is a small file placed on your device when you visit a website. This page lists the cookies and similar technologies Qdot uses, in accordance with article 82 of the French Data Protection Act and CNIL guidance.",
    sections: [
      {
        id: "used",
        heading: "Cookies and storage we use",
        body: [
          {
            list: [
              "qdot_session — session cookie, set when you sign in. It keeps you securely signed in (HttpOnly, SameSite=Lax). Lifetime: 30 days at most, removed on sign-out.",
              "qdot-locale — remembers the language you picked (French or English). Lifetime: 12 months.",
              "Browser local storage (localStorage / sessionStorage) — keeps a QR code being created during sign-up and some display preferences. This data never leaves your device.",
            ],
          },
        ],
      },
      {
        id: "consent",
        heading: "Why is there no consent banner?",
        body: [
          "These technologies are strictly necessary for the service to work, or respond to an explicit request from you (choosing a language). They are therefore exempt from consent. Qdot uses no advertising, third-party analytics or social media cookies.",
        ],
      },
      {
        id: "scans",
        heading: "People who scan a QR code",
        body: [
          "Redirecting a QR code places no cookie or other tracker on the scanning device. Statistics are computed server-side, as explained in the privacy policy.",
        ],
      },
      {
        id: "manage",
        heading: "Managing cookies",
        body: [
          "You can delete or block cookies in your browser settings. Blocking the session cookie will prevent you from signing in; blocking the language cookie will show the site in your browser's language.",
        ],
      },
    ],
  },
};
