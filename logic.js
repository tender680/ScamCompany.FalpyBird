// ==========================================
// 1. SÉLECTION DES ÉLÉMENTS & VARIABLES
// ==========================================
const bird = document.getElementById("bird");
const board = document.getElementById("board");
displayscore = document.getElementById("score");
displayscore.innerText = "Score : 0";
testeur = document.createElement("div")
let pipes = []; // Tableau contenant tous les tuyaux

// --- CONSTANTES (Réglages du jeu) ---
const GRAVITY = 1200;      // Pesanteur (tire vers le bas)
const JUMP_FORCE = -350;   // Force du saut
const SPEED_X = 150;       // Vitesse de défilement vers la gauche
const SPAWN_RATE = 2.0;    // Un tuyau toutes les 2 secondes

// --- DIMENSIONS PHYSIQUES (Doivent correspondre à tes images/CSS) ---
const BIRD_WIDTH = 34;     // Largeur de la hitbox oiseau
const BIRD_HEIGHT = 24;    // Hauteur de la hitbox oiseau
const BIRD_X_FIXED = 50;   // Position X fixe de l'oiseau

const PIPE_WIDTH = 60;     // Largeur du tuyau
const PIPE_HEIGHT = 300;   // Hauteur du tuyau
let PIPE_GAP = 150 ;      // TAILLE DU TROU (Passage)

// --- VARIABLES D'ÉTAT ---
let birdY = 200;           // Position Y oiseau
let velocityY = 0;         // Vitesse Y oiseau
let angle = 0;             // Rotation oiseau
let lastTime = 0;          // Pour le Delta Time
let touched = false;       // État Game Over
let timeSinceLastSpawn = 0;// Compteur pour le spawn
let record = 0 
let nb_pipes = false;
// ==========================================
// 2. GESTION DU CLAVIER
// ==========================================
document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        if (!touched) {
            velocityY = JUMP_FORCE; // Sauter
        } else {
            location.reload(); // Rejouer si perdu
        }
    }
});

// ==========================================
// 3. BOUCLE PRINCIPALE (Game Loop)
// ==========================================
function gameLoop(timestamp) {
    // Calcul du temps écoulé (Delta Time)
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Sécurité anti-lag (si on change d'onglet)
    if (isNaN(dt) || dt > 0.1) dt = 0.016;

    // Si on a perdu, on arrête la physique mais on continue d'afficher
    if (touched) {
        draw();
        requestAnimationFrame(gameLoop); // On boucle juste pour le dessin (figé ou animation de mort)
        return; 
    }

    // Gestion du Spawn (Création des tuyaux)
    timeSinceLastSpawn += dt;
    if (timeSinceLastSpawn > SPAWN_RATE) {
        createPipe();
        timeSinceLastSpawn = 0;
    }
    if(nb_pipes)
    {
        score();
        
    }


    // Mise à jour Physique & Collisions
    updatePhysics(dt);
    checkCollision();


    // Mise à jour Visuelle
    draw();
    // Boucle suivante
    requestAnimationFrame(gameLoop);
}

// ==========================================
// 4. PHYSIQUE (Calculs des mouvements)
// ==========================================
function updatePhysics(dt) {
    // --- OISEAU ---
    velocityY += GRAVITY * dt;
    birdY += velocityY * dt;

    // Rotation visuelle (tête en haut/bas)
    angle = velocityY * 0.1;
    if (angle > 80) angle = 80;

    // Limites Sol et Plafond
    if (birdY > 580) { // 640 (hauteur jeu) - hauteur oiseau - un peu de marge
        birdY = 580;
        touched = true; // Toucher le sol tue
    }
    if (birdY < 0) {
        birdY = 0;
        velocityY = 0;
        touched = true; // Toucher le plafond tue
    }

    // --- TUYAUX ---
    pipes.forEach((pipe, index) => {
        // On déplace la propriété logique posX
        pipe.posX -= SPEED_X * dt;

        // Suppression si sorti de l'écran à gauche
        if (pipe.posX < -100) {
            pipe.remove(); // Retire du HTML
            pipes.splice(index, 1); // Retire du tableau
        }
    });
}
function score(){

    if(pipes[0].posX + 5<= BIRD_X_FIXED&&!pipes[0].ispassed&&pipes[0].isTop)
    {
        record += 1;
        pipes[0].ispassed = true
        displayscore.innerText = "Score : " +record;
        PIPE_GAP -= record
        testeur.innerText = PIPE_GAP
        displayscore.appendChild(testeur)
    }
}
// ==========================================
// 5. CRÉATION DES TUYAUX (Logique du trou)
// ==========================================
function createPipe() {
    // Calcul de la position Y où s'arrête le tuyau du haut
    // Le trou peut être entre 50px du haut et 400px du haut
    nb_pipes = true;
    const minHeight = 50;
    const maxHeight = 640 - PIPE_GAP -50;
    const openingY = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    // --- TUYAU DU HAUT ---
    let pipeTop = document.createElement("img");
    pipeTop.src = "pipe.png";
    pipeTop.className = "obstacle";
    pipeTop.posX = 640; // Commence à droite
    
    // Position : Le bas du tuyau doit être à "openingY"
    // Donc le haut du tuyau est à "openingY - PIPE_HEIGHT"
    pipeTop.topY = openingY - PIPE_HEIGHT;
    pipeTop.style.top = pipeTop.topY + "px";
    pipeTop.isTop = true; // Marqueur pour dire "c'est celui du haut"
    pipeTop.ispassed = false

    // --- TUYAU DU BAS ---
    let pipeBottom = document.createElement("img");
    pipeBottom.src = "pipe.png";
    pipeBottom.className = "obstacle";
    pipeBottom.posX = 640;

    // Position : Il commence après le trou
    pipeBottom.topY = openingY + PIPE_GAP;
    pipeBottom.style.top = pipeBottom.topY + "px";
    pipeBottom.isTop = false;

    // Ajout au DOM et au Tableau
    board.appendChild(pipeTop);
    board.appendChild(pipeBottom);
    pipes.push(pipeTop);
    pipes.push(pipeBottom);
}

// ==========================================
// 6. COLLISIONS (Mathématiques)
// ==========================================
function checkCollision() {
    // On définit la boite de l'oiseau
    // Padding = 4px pour être gentil (hitbox un peu plus petite que l'image)
    const padding = 4;
    const birdLeft = BIRD_X_FIXED + padding;
    const birdRight = BIRD_X_FIXED + BIRD_WIDTH - padding;
    const birdTop = birdY + padding;
    const birdBottom = birdY + BIRD_HEIGHT - padding;

    pipes.forEach(pipe => {
        // On définit la boite du tuyau
        // Padding Pipe = 5px (si ton image a un peu de bord transparent)
        const paddingPipe = 5; 
        const pipeLeft = pipe.posX + paddingPipe;
        const pipeRight = pipe.posX + PIPE_WIDTH - paddingPipe;
        const pipeTop = pipe.topY + paddingPipe;
        const pipeBottom = pipe.topY + PIPE_HEIGHT - paddingPipe;

        // FORMULE D'INTERSECTION (AABB)
        if (
            birdRight > pipeLeft &&
            birdLeft < pipeRight &&
            birdBottom > pipeTop &&
            birdTop < pipeBottom
        ) {
            touched = true;
            console.log("BOUM ! Collision détectée.");
            bird.style.backgroundColor = "red"; // Feedback visuel
        }
    });
}

// ==========================================
// 7. DESSIN (Mise à jour du CSS)
// ==========================================
function draw() {
    // Dessin Oiseau
    bird.style.transform = `translateY(${birdY}px) rotate(${angle}deg)`;

    // Dessin Tuyaux
    pipes.forEach(pipe => {
        // Si c'est le tuyau du haut, on le tourne à 180° visuellement
        let rotation = pipe.isTop ? 180 : 0;
        
        // On applique X et la Rotation
        pipe.style.transform = `translateX(${pipe.posX}px) rotate(${rotation}deg)`;
    });
}

// Lancement du jeu
requestAnimationFrame(gameLoop);