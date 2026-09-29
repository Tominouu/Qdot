import { LEGAL_ENTITY as E } from "./entity";
import type { LegalDocs } from "./types";

export const legalFr: LegalDocs = {
  notice: {
    title: "Mentions légales",
    intro:
      "Conformément à l'article 1-1 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), les informations suivantes sont portées à la connaissance des utilisateurs du site Qdot.",
    sections: [
      {
        id: "editeur",
        heading: "Éditeur du site",
        body: [
          {
            list: [
              `Éditeur : ${E.name}`,
              `Forme juridique : ${E.legalForm}`,
              `Siège social : ${E.address}`,
              `Immatriculation : ${E.registration}`,
              `TVA intracommunautaire : ${E.vatNumber}`,
              `E-mail : ${E.email}`,
              `Téléphone : ${E.phone}`,
              `Site : ${E.websiteUrl}`,
            ],
          },
        ],
      },
      {
        id: "directeur",
        heading: "Directeur de la publication",
        body: [`${E.publicationDirector}, joignable à l'adresse ${E.email}.`],
      },
      {
        id: "hebergeur",
        heading: "Hébergeurs",
        body: [
          "Site web (pages et ressources statiques) :",
          { list: [`Hébergeur : ${E.host.name}`, `Adresse : ${E.host.address}`, `Téléphone : ${E.host.phone}`] },
          "API, redirection des QR codes et base de données :",
          { list: [`Hébergeur : ${E.apiHost.name}`, `Adresse : ${E.apiHost.address}`, `Téléphone : ${E.apiHost.phone}`, `Localisation des serveurs : ${E.apiHost.location.fr}`] },
        ],
      },
      {
        id: "signalement",
        heading: "Signalement de contenus illicites",
        body: [
          "Les QR codes créés sur Qdot redirigent vers des adresses choisies par leurs auteurs. Si un QR code renvoie vers un contenu que vous estimez illicite (hameçonnage, logiciel malveillant, contrefaçon, contenu haineux…), vous pouvez le signaler en écrivant à " +
            `${E.abuseEmail}. Ce point de contact unique est également destiné aux autorités (règlement (UE) 2022/2065, « DSA », articles 11 et 12).`,
          "Pour être traité rapidement, votre signalement doit préciser l'adresse du QR code concerné (lien court), la nature du contenu, les raisons pour lesquelles vous le jugez illicite et vos coordonnées. Un signalement abusif peut engager la responsabilité de son auteur.",
        ],
      },
      {
        id: "propriete",
        heading: "Propriété intellectuelle",
        body: [
          "Le code source de Qdot est distribué sous licence MIT : vous pouvez l'utiliser, le modifier et le redistribuer dans les conditions de cette licence. Le nom, le logo et l'identité visuelle de Qdot restent la propriété de l'éditeur et ne peuvent être reproduits sans autorisation.",
          "Les contenus que vous créez (noms de QR codes, logos importés, adresses de destination) restent votre propriété.",
          "La géolocalisation approximative des scans utilise la base IP to City Lite de DB-IP (https://db-ip.com), distribuée sous licence Creative Commons Attribution 4.0. Le fond de carte utilise les données Natural Earth (domaine public).",
        ],
      },
      {
        id: "responsabilite",
        heading: "Responsabilité",
        body: [
          "L'éditeur s'efforce d'assurer l'exactitude des informations publiées et la disponibilité du service, sans pouvoir le garantir. Il ne saurait être tenu responsable du contenu des sites vers lesquels redirigent les QR codes créés par les utilisateurs.",
        ],
      },
      {
        id: "donnees",
        heading: "Données personnelles et cookies",
        body: [
          "Le traitement de vos données personnelles est décrit dans la politique de confidentialité, et l'usage des cookies dans la politique cookies, accessibles en bas de chaque page.",
        ],
      },
      {
        id: "droit",
        heading: "Droit applicable",
        body: ["Les présentes mentions légales sont régies par le droit français."],
      },
    ],
  },

  privacy: {
    title: "Politique de confidentialité",
    intro:
      "Cette politique explique quelles données personnelles Qdot traite, pourquoi, pendant combien de temps et comment exercer vos droits, conformément au règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 « Informatique et Libertés ».",
    sections: [
      {
        id: "responsable",
        heading: "Responsable du traitement",
        body: [
          `Le responsable du traitement est ${E.name}, ${E.address}. Pour toute question relative à vos données : ${E.privacyEmail}.`,
          "Deux situations sont à distinguer :",
          {
            list: [
              "pour les données de votre compte Qdot, l'éditeur est responsable du traitement ;",
              "pour les statistiques de scans d'un QR code, c'est le titulaire du compte qui a créé le code qui décide de leur utilisation : il est responsable du traitement et l'éditeur agit en tant que sous-traitant (article 28 du RGPD), dans les conditions prévues par les conditions générales d'utilisation.",
            ],
          },
        ],
      },
      {
        id: "compte",
        heading: "Données des titulaires de compte",
        body: [
          {
            list: [
              "Données : adresse e-mail, nom, mot de passe (conservé uniquement sous forme d'empreinte Argon2id, jamais en clair), date de création du compte, QR codes et campagnes que vous créez (noms, contenus encodés, styles, logos et images).",
              "Contenu des QR codes : selon le type choisi, adresse web, coordonnées d'une carte de visite (vCard), adresse e-mail, objet et message, numéro de téléphone et message SMS, ou nom et mot de passe d'un réseau Wi-Fi. Ces informations sont celles que vous saisissez ; si elles concernent d'autres personnes (par exemple une carte de visite), il vous appartient de disposer de leur accord.",
              "Espaces de travail : les QR codes, campagnes et statistiques d'un espace sont visibles par ses membres, selon leur rôle (propriétaire, admin, éditeur, lecteur). Les membres voient le nom et l'adresse e-mail des autres membres. Une invitation conserve l'adresse e-mail invitée, le rôle proposé et son statut ; le lien d'invitation n'est jamais stocké en clair et expire au bout de 7 jours.",
              "Mots de passe Wi-Fi : ils sont conservés pour que vous puissiez rouvrir, modifier et réexporter le QR code. Ils sont chiffrés au repos (AES-256-GCM) avec une clé propre au serveur, ne figurent jamais dans les journaux techniques, ne sont jamais renvoyés dans les listes de QR codes et ne sont déchiffrés que lorsque vous consultez ou modifiez le QR code concerné. Ils sont supprimés avec le QR code ou le compte.",
              "Finalités : créer et sécuriser votre compte, fournir le service (création, modification et redirection des QR codes, statistiques), vous contacter au sujet du service.",
              "Base légale : exécution du contrat qui nous lie, c'est-à-dire les conditions générales d'utilisation (article 6.1.b du RGPD).",
              "Durée de conservation : pendant toute la vie du compte. La suppression du compte entraîne la suppression de ses QR codes, campagnes et statistiques. Les sessions de connexion expirent automatiquement après 30 jours.",
            ],
          },
        ],
      },
      {
        id: "scans",
        heading: "Données des personnes qui scannent un QR code",
        body: [
          "Lorsqu'une personne scanne un QR code Qdot, son téléphone interroge nos serveurs, qui la redirigent vers la destination choisie. À cette occasion :",
          {
            list: [
              "l'adresse IP est utilisée uniquement au moment du scan pour déduire une localisation approximative (pays, région, ville) à partir d'une base de données installée sur nos serveurs. L'adresse IP n'est jamais enregistrée ;",
              "le navigateur envoie une chaîne « user-agent », dont nous déduisons le type d'appareil (mobile, tablette, ordinateur), le système d'exploitation et le navigateur ;",
              "seul le nom de domaine du site d'origine (référent) est conservé, lorsqu'il est transmis ;",
              "pour compter les visiteurs uniques, un identifiant pseudonyme est calculé à partir de l'adresse IP, du user-agent et d'une valeur aléatoire renouvelée chaque jour et conservée uniquement en mémoire. Il ne permet ni de retrouver l'adresse IP ni de suivre une personne d'un jour à l'autre.",
            ],
          },
          "Aucun cookie n'est déposé sur l'appareil de la personne qui scanne, et aucune donnée n'est vendue ni utilisée à des fins publicitaires.",
          "Finalité : fournir au créateur du QR code des statistiques de mesure d'audience. Base légale : intérêt légitime du créateur du QR code à mesurer l'efficacité de ses supports (article 6.1.f du RGPD), avec un impact limité pour les personnes compte tenu des garanties ci-dessus. Durée de conservation : tant que le QR code existe ; les événements de scan sont supprimés avec lui.",
          "Vous pouvez vous opposer à ce traitement en contactant le créateur du QR code ou en nous écrivant : nous transmettrons votre demande.",
        ],
      },
      {
        id: "navigateur",
        heading: "Données conservées dans votre navigateur",
        body: [
          "Le site utilise un cookie de session et un cookie de préférence de langue, ainsi que le stockage local du navigateur (brouillon d'un QR code en cours de création, préférences d'affichage). Ces éléments sont strictement nécessaires au fonctionnement du service ; ils sont détaillés dans la politique cookies.",
        ],
      },
      {
        id: "destinataires",
        heading: "Destinataires et sous-traitants",
        body: [
          `Les données de compte et les statistiques de scans sont stockées sur un serveur privé virtuel situé en ${E.apiHost.location.fr}, loué auprès de l'hébergeur ${E.apiHost.name}. Ce serveur est administré exclusivement par l'éditeur : l'hébergeur fournit l'infrastructure matérielle et agit en tant que sous-traitant, sans exploiter les données. Elles ne quittent pas l'Union européenne.`,
          "Aucune donnée n'est vendue, louée ni cédée à des tiers, ni utilisée à des fins publicitaires.",
          `Les pages du site sont servies par ${E.host.name} (${E.host.location.fr}), également sous-traitant. Lorsque vous consultez le site, ce prestataire traite uniquement vos données de connexion techniques (adresse IP, pages demandées, navigateur) afin de vous les délivrer et d'assurer la sécurité du service ; il n'a pas accès à votre compte ni aux statistiques de scans, et la redirection des QR codes ne passe pas par lui.`,
          `Ce traitement implique un transfert de données vers les États-Unis. Il est encadré par les clauses contractuelles types de la Commission européenne intégrées à l'accord de traitement des données de ${E.host.name} et, le cas échéant, par sa certification au cadre de protection des données UE–États-Unis (Data Privacy Framework, décision d'adéquation du 10 juillet 2023). Vous pouvez obtenir une copie de ces garanties en nous écrivant.`,
          "Les données peuvent être communiquées aux autorités lorsque la loi l'exige.",
        ],
      },
      {
        id: "securite",
        heading: "Sécurité",
        body: [
          "Les échanges sont chiffrés (HTTPS), les mots de passe de compte sont hachés avec Argon2id, les mots de passe Wi-Fi sont chiffrés en AES-256-GCM, le cookie de session est inaccessible aux scripts (HttpOnly) et seule une empreinte du jeton de session est conservée en base.",
        ],
      },
      {
        id: "droits",
        heading: "Vos droits",
        body: [
          "Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition sur vos données, ainsi que du droit de définir des directives relatives à leur sort après votre décès.",
          `Pour les exercer, écrivez à ${E.privacyEmail} en précisant l'adresse e-mail de votre compte. Nous répondons dans un délai d'un mois. Une pièce justificative pourra vous être demandée en cas de doute raisonnable sur votre identité.`,
          "Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — www.cnil.fr).",
        ],
      },
      {
        id: "mineurs",
        heading: "Mineurs",
        body: [
          "Le service est destiné aux personnes âgées d'au moins 15 ans. En dessous de cet âge, la création d'un compte nécessite l'accord d'un titulaire de l'autorité parentale.",
        ],
      },
      {
        id: "modifications",
        heading: "Modifications",
        body: [
          "Cette politique peut évoluer. La date de dernière mise à jour figure en haut de la page ; en cas de changement important, les titulaires de compte en seront informés.",
        ],
      },
    ],
  },

  terms: {
    title: "Conditions générales d'utilisation",
    intro:
      "Les présentes conditions générales d'utilisation (CGU) encadrent l'accès et l'utilisation du service Qdot. La création d'un compte vaut acceptation sans réserve des CGU.",
    sections: [
      {
        id: "objet",
        heading: "1. Objet et service",
        body: [
          `Qdot, édité par ${E.name}, permet de créer des QR codes dynamiques personnalisables, de modifier leur destination après impression et de consulter des statistiques de scans.`,
          "Le service est fourni gratuitement. Si des offres payantes étaient proposées, elles feraient l'objet de conditions générales de vente distinctes, acceptées avant toute commande.",
        ],
      },
      {
        id: "compte",
        heading: "2. Compte",
        body: [
          "L'utilisation du service nécessite un compte, créé avec une adresse e-mail valide et un mot de passe. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis votre compte. Prévenez-nous sans délai en cas d'utilisation non autorisée.",
          "Vous devez avoir au moins 15 ans, ou disposer de l'accord d'un titulaire de l'autorité parentale.",
        ],
      },
      {
        id: "usage",
        heading: "3. Utilisation acceptable",
        body: [
          "Vous êtes seul responsable des destinations vers lesquelles vos QR codes redirigent. Il est notamment interdit d'utiliser Qdot pour :",
          {
            list: [
              "l'hameçonnage, l'escroquerie ou la collecte frauduleuse d'identifiants ou de moyens de paiement ;",
              "la diffusion de logiciels malveillants ;",
              "des contenus illicites : pédopornographie, apologie du terrorisme, incitation à la haine, contrefaçon, atteinte à la vie privée ou aux droits de tiers ;",
              "l'envoi de communications non sollicitées (spam) ;",
              "toute tentative de perturber le service ou d'en contourner les limites techniques.",
            ],
          },
        ],
      },
      {
        id: "moderation",
        heading: "4. Signalements et suspension",
        body: [
          `Tout contenu illicite peut être signalé à ${E.abuseEmail}. Après examen, l'éditeur peut désactiver un QR code, suspendre ou supprimer un compte en cas de manquement aux présentes CGU ou sur demande d'une autorité. Sauf urgence ou obligation légale, vous serez informé de la décision et de ses motifs, et pourrez la contester en répondant au message reçu.`,
        ],
      },
      {
        id: "donnees-scans",
        heading: "5. Statistiques de scans et données personnelles",
        body: [
          "Pour les statistiques de scans de vos QR codes, vous êtes responsable du traitement et l'éditeur agit comme sous-traitant, uniquement sur vos instructions telles que traduites par les fonctionnalités du service. L'éditeur s'engage à : traiter ces données uniquement pour produire vos statistiques ; en garantir la confidentialité et la sécurité ; ne faire appel qu'à des sous-traitants offrant des garanties équivalentes (actuellement son hébergeur) ; vous aider à répondre aux demandes d'exercice de droits ; vous notifier toute violation de données dans les meilleurs délais ; supprimer ces données à la suppression du QR code ou du compte.",
          "Il vous appartient d'informer les personnes qui scannent vos QR codes, par exemple par une mention sur vos supports imprimés ou sur la page de destination. Le détail des données collectées figure dans la politique de confidentialité.",
        ],
      },
      {
        id: "disponibilite",
        heading: "6. Disponibilité",
        body: [
          "L'éditeur met en œuvre des moyens raisonnables pour assurer l'accès au service et la redirection des QR codes, sans garantie de disponibilité permanente. Le service peut être interrompu pour maintenance, mise à jour ou cas de force majeure. Un QR code mis en pause, archivé ou supprimé ne redirige plus.",
        ],
      },
      {
        id: "propriete",
        heading: "7. Propriété intellectuelle",
        body: [
          "Le code source de Qdot est publié sous licence MIT. Vous conservez tous les droits sur les contenus que vous importez (logos, noms) et accordez à l'éditeur une licence limitée à leur hébergement et à leur affichage, pour les seuls besoins du service. Vous garantissez disposer des droits nécessaires sur ces contenus.",
        ],
      },
      {
        id: "responsabilite",
        heading: "8. Responsabilité",
        body: [
          "Le service est fourni « en l'état ». L'éditeur ne peut être tenu responsable des dommages indirects, ni du contenu des sites de destination, ni d'un QR code rendu illisible par un choix de couleurs ou de motif. Rien dans les présentes ne limite la responsabilité de l'éditeur en cas de faute lourde ou dolosive, ni les droits dont vous bénéficiez en tant que consommateur.",
        ],
      },
      {
        id: "duree",
        heading: "9. Durée et résiliation",
        body: [
          `Les CGU s'appliquent pendant toute la durée d'utilisation du service. Vous pouvez supprimer votre compte à tout moment en écrivant à ${E.email} ; vos QR codes cesseront alors de rediriger.`,
        ],
      },
      {
        id: "modification",
        heading: "10. Modification des CGU",
        body: [
          "L'éditeur peut faire évoluer les CGU. Les titulaires de compte sont informés de toute modification importante au moins 15 jours avant son entrée en vigueur ; la poursuite de l'utilisation du service vaut acceptation des nouvelles conditions.",
        ],
      },
      {
        id: "droit",
        heading: "11. Droit applicable et litiges",
        body: [
          "Les CGU sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire. Le consommateur peut également recourir gratuitement à un médiateur de la consommation (articles L. 611-1 et suivants du Code de la consommation) ou à la plateforme européenne de règlement en ligne des litiges. À défaut d'accord, les tribunaux compétents sont ceux désignés par les règles de droit commun.",
        ],
      },
    ],
  },

  cookies: {
    title: "Politique cookies",
    intro:
      "Un cookie est un petit fichier déposé sur votre appareil lors de la visite d'un site. Cette page liste les cookies et autres traceurs utilisés par Qdot, conformément à l'article 82 de la loi Informatique et Libertés et aux recommandations de la CNIL.",
    sections: [
      {
        id: "utilises",
        heading: "Cookies et stockage utilisés",
        body: [
          {
            list: [
              "qdot_session — cookie de session, déposé à la connexion. Il vous maintient connecté de façon sécurisée (HttpOnly, SameSite=Lax). Durée : 30 jours au maximum, supprimé à la déconnexion.",
              "qdot-locale — mémorise la langue que vous avez choisie (français ou anglais). Durée : 12 mois.",
              "Stockage local du navigateur (localStorage / sessionStorage) — conserve un QR code en cours de création pendant l'inscription et certaines préférences d'affichage. Ces données ne quittent pas votre appareil.",
            ],
          },
        ],
      },
      {
        id: "consentement",
        heading: "Pourquoi aucun bandeau de consentement ?",
        body: [
          "Ces traceurs sont strictement nécessaires au fonctionnement du service ou répondent à une demande expresse de votre part (choix de la langue). Ils sont donc exemptés de consentement. Qdot n'utilise aucun cookie publicitaire, de mesure d'audience tierce ni de réseau social.",
        ],
      },
      {
        id: "scans",
        heading: "Personnes qui scannent un QR code",
        body: [
          "La redirection d'un QR code ne dépose aucun cookie ni aucun autre traceur sur l'appareil de la personne qui le scanne. Les statistiques sont calculées côté serveur, comme expliqué dans la politique de confidentialité.",
        ],
      },
      {
        id: "gerer",
        heading: "Gérer les cookies",
        body: [
          "Vous pouvez supprimer ou bloquer les cookies depuis les réglages de votre navigateur. Bloquer le cookie de session vous empêchera de vous connecter ; bloquer le cookie de langue affichera le site dans la langue de votre navigateur.",
        ],
      },
    ],
  },
};
