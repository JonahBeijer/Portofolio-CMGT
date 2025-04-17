// translations.js
export const translations = {
    nl: {
        langButton: "🇬🇧 English",
        portfolioTitle: "Mijn Portfolio",
        navHome: "Home",
        navProjects: "Projecten",
        navLanguages: "Programmeertalen",
        aboutTitle: "Over het project",
        techTitle: "Technologieën",
        backLink: "Terug naar projecten",

        heading: "Over Mij",
        bio: `Hoi! Mijn naam is <strong>Jonah Beijer</strong> en ik ben een enthousiaste developer met een passie voor webontwikkeling, design en het creëren van gebruiksvriendelijke interfaces.<br />
        Ik werk graag met tools zoals Tailwind CSS en JavaScript. In mijn vrije tijd houd ik van <em>haken, muziek luisteren, schilderen en bakken</em>.`,

        navbarTitle: "Mijn Portfolio",
        homeLink: "Home",
        projectsLink: "Projecten",
        programmingLanguagesLink: "Programmeertalen",
        projectCardDescGamemaniac: "Mijn allereerste website, gebouwd met enkel HTML en CSS.",
        projectCardDescAnimeCollection: "Een anime-verzamelsite met een CRUD-systeem en database.",
        projectCardDescMuziekGallary: "Een muziekgalerij-website gemaakt met HTML, CSS, JavaScript en PHP.",
        projectCardDescEerste2DGame: "Mijn eerste 2D game gemaakt met Excalibur.js en JavaScript.",
        projectCardDescSpinShare: "Een Laravel-platform waar gebruikers hun favoriete albums kunnen delen.",
        projectCardDescMeerkatGaming: "Een gaming community site gebouwd met React en moderne webtechnologieën.",
        projectDetailsLink: "Meer informatie",
        projectsTitle: "Mijn Projecten",

        gamemaniacTitle: "Gamemanic - Projectdetails",
        gamemaniacAbout: "Gamemanic is mijn eerste project, gemaakt met alleen HTML en CSS. Het is een simpele website die ik heb gebouwd om meer te leren over webontwikkeling en het creëren van gebruikersinterfaces.",

        animeCollectionTitle: "Anime Collection - Projectdetails",
        animeCollectionAbout: "Anime Collection is een dynamische website waar gebruikers hun favoriete anime-series kunnen toevoegen, bewerken en verwijderen. De site maakt gebruik van PHP en MySQL voor back-end functionaliteit en is voorzien van een gebruiksvriendelijke interface.",

        meerkatGamingTitle: "Meerkat Gaming - Projectdetails",
        meerkatGamingAbout: "Meerkat Gaming is een gaming-gerelateerde website gemaakt in teamverband. De focus lag op samenwerking, het verdelen van taken, en het toepassen van frontend- én backendtechnieken. De site bevat nieuws, reviews en een overzicht van populaire games.",

        musicGalleryTitle: "Muziek Gallery - Projectdetails",
        musicGalleryAbout: "Muziek Gallery is een interactieve webapplicatie waar gebruikers muziek kunnen ontdekken en bekijken in een galerij-achtige omgeving. Het project combineert frontend en backend technologieën en maakt gebruik van PHP en JavaScript.",
        viewGitHub: "Bekijk op GitHub",
        viewWebsite: "Bekijk de website",

        gamePageTitle: "Game - Projectdetails",
        gameAboutText: `Dit is een spel dat ik heb ontwikkeld met behulp van <strong>Excalibur.js</strong>, een 2D game-engine voor JavaScript. In het spel nemen twee spelers het tegen elkaar op in een racespel waarin snelheid en timing cruciaal zijn. Ik heb gewerkt met physics, collision detection en sprite-animaties om de game soepel te laten verlopen.`,
        spinShareTitle: "SpinShare - Projectdetails",
        spinShareAbout: "SpinShare is een sociale muziekapplicatie waarbij gebruikers hun favoriete albums kunnen delen, beoordelen en ontdekken. Het project is volledig gebouwd met Laravel en bevat gebruikersauthenticatie, albumbeheer, een admin-paneel en filter- en zoekfuncties.",
    },

    en: {
        langButton: "🇳🇱 Nederlands",
        portfolioTitle: "My Portfolio",
        navHome: "Home",
        navProjects: "Projects",
        navLanguages: "Programming Languages",
        aboutTitle: "About the project",
        techTitle: "Technologies",
        backLink: "Back to projects",

        heading: "About Me",
        bio: `Hi! My name is <strong>Jonah Beijer</strong> and I am an enthusiastic developer with a passion for web development, design, and creating user-friendly interfaces.<br />
        I enjoy working with tools like Tailwind CSS and JavaScript. In my free time, I love <em>crocheting, listening to music, painting, and baking</em>.`,

        navbarTitle: "My Portfolio",
        homeLink: "Home",
        projectsLink: "Projects",
        programmingLanguagesLink: "Programming Languages",
        projectCardDescGamemaniac: "My very first website, built with only HTML and CSS.",
        projectCardDescAnimeCollection: "An anime collection site with CRUD functionality and database.",
        projectCardDescMuziekGallary: "A music gallery website made with HTML, CSS, JavaScript, and PHP.",
        projectCardDescEerste2DGame: "My first 2D game created with Excalibur.js and JavaScript.",
        projectCardDescSpinShare: "A Laravel-based platform where users can share their favorite albums.",
        projectCardDescMeerkatGaming: "A gaming community website built with React and modern technologies.",
        projectDetailsLink: "More details",
        projectsTitle: "My Projects",

        gamemaniacTitle: "Gamemanic - Project Details",
        gamemaniacAbout: "Gamemanic is my first project, made with just HTML and CSS. It’s a simple website I built to learn more about web development and creating user interfaces.",

        animeCollectionTitle: "Anime Collection - Project Details",
        animeCollectionAbout: "Anime Collection is a dynamic website where users can add, edit, and delete their favorite anime series. The site uses PHP and MySQL for backend functionality and features a user-friendly interface.",

        meerkatGamingTitle: "Meerkat Gaming - Project Details",
        meerkatGamingAbout: "Meerkat Gaming is a gaming-related website created as a team project. The focus was on collaboration, dividing tasks, and applying both frontend and backend techniques. The site includes news, reviews, and an overview of popular games.",

        musicGalleryTitle: "Music Gallery - Project Details",
        musicGalleryAbout: "Music Gallery is an interactive web application where users can explore and view music in a gallery-like setting. The project combines frontend and backend technologies, using PHP and JavaScript.",
        viewGitHub: "View on GitHub",
        viewWebsite: "View the website",

        gamePageTitle: "Game - Project Details",
        gameAboutText: `This is a game I developed using <strong>Excalibur.js</strong>, a 2D game engine for JavaScript. In the game, two players compete in a racing game where speed and timing are crucial. I worked with physics, collision detection, and sprite animations to ensure smooth gameplay.`,
        spinShareTitle: "SpinShare - Project Details",
        spinShareAbout: "SpinShare is a social music application where users can share, rate, and discover their favorite albums. The project is fully built with Laravel and includes user authentication, album management, an admin panel, and filter and search functionalities.",
    }
};

export let currentLanguage = localStorage.getItem("language") || "nl";

export function setLanguage(lang) {
    const t = translations[lang];
    document.documentElement.lang = lang;
    document.getElementById('langToggle').checked = lang === 'en';

    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (t[key]) el.textContent = t[key];
    });

    // HTML-content velden
    const innerHTMLMap = {
        bio: t.bio,
        gameAboutText: t.gameAboutText,
        spinShareAbout: t.spinShareAbout,
        gamemaniacAbout: t.gamemaniacAbout
    };

    Object.entries(innerHTMLMap).forEach(([id, content]) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = content;
    });

    // TextContent voor specifieke elementen
    const textContentMap = {
        langToggle: t.langButton,
        portfolioTitle: t.portfolioTitle,
        navHome: t.navHome,
        navProjects: t.navProjects,
        navLanguages: t.navLanguages,
        heading: t.heading,
        gamePageTitle: t.gamePageTitle,
        spinShareTitle: t.spinShareTitle,
        projectsTitle: t.projectsTitle,
        backLink: t.backLink,
        backToProjects: t.backLink
    };

    Object.entries(textContentMap).forEach(([id, content]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = content;
    });

    localStorage.setItem("language", lang);
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
}

// Init language on page load
document.addEventListener("DOMContentLoaded", () => {
    setLanguage(currentLanguage);
    // Voeg deze regel toe:
    document.getElementById('langToggle').checked = currentLanguage === 'en';
});

// Language switcher
document.getElementById("langToggle")?.addEventListener("change", (e) => {
    currentLanguage = e.target.checked ? 'en' : 'nl';
    setLanguage(currentLanguage);
});
