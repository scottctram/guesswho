const repoConfig = {
    owner: "scottctram",
    name: "guesswho",
    branch: "main",
    paths: {
        scole: "images/scoleparty",
        other: "images/otherparty"
    }
};

async function fetchImages(folderPath) {
    try {
        const response = await fetch(`https://api.github.com/repos/${repoConfig.owner}/${repoConfig.name}/contents/${folderPath}?ref=${repoConfig.branch}`);
        if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
        
        const files = await response.json();
        return files
            .filter(file => file.type === "file" && file.name.match(/\.(jpg|jpeg|png|gif)$/i))
            .map(file => file.download_url);
    } catch (error) {
        console.error("Error fetching images:", error);
        return [];
    }
}

async function loadImages() {
    const [scoleImages, otherImages] = await Promise.all([
        fetchImages(repoConfig.paths.scole),
        fetchImages(repoConfig.paths.other)
    ]);
    
    generateGrid(scoleImages, 'scoleGrid');
    generateGrid(otherImages, 'otherGrid');
}

function generateGrid(images, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = images
        .map(image => `<img src="${image}" data-filename="${image}" onclick="toggleSelection(this)">`)
        .join('');
}

function toggleSelection(imgElement) {
    imgElement.classList.toggle('deselected');
}

function toggleOtherParty() {
    const images = document.querySelectorAll('#otherGrid img');
    const allDeselected = Array.from(images).every(img => img.classList.contains('deselected'));
    
    images.forEach(img => img.classList.toggle('deselected', !allDeselected));
    document.getElementById('toggleOtherPartyButton').textContent = allDeselected ? 'Deselect Expansion Pack' : 'Reselect Expansion Pack';
}

function pickRandomImage() {
    const availableImages = [...document.querySelectorAll('.grid img:not(.deselected)')]
        .map(img => img.dataset.filename);
    
    if (availableImages.length === 0) return alert('All images are de-selected, please select or refresh!');
    
    const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
    document.getElementById('randomImage').src = randomImage;
    document.getElementById('randomImage').style.display = 'block';
    
    
    document.getElementById('lockContainer').style.display = 'block';
    document.getElementById('lockButton').style.display = 'inline-block';
}

async function fetchCharacterMetadata() {
    try {
        const response = await fetch(`https://api.github.com/repos/${repoConfig.owner}/${repoConfig.name}/contents/data/characters.json?ref=${repoConfig.branch}`);
        
        if (!response.ok) {
            throw new Error('Error fetching character metadata');
        }

        const metadata = await response.json();
        
        // Decode the Base64 content
        const base64Content = metadata.content;
        const decodedContent = atob(base64Content);  
        
        // Parse the decoded content into JSON
        const characters = JSON.parse(decodedContent);
        
        return characters; 
    } catch (error) {
        console.error('Error in fetchCharacterMetadata:', error);
        throw error;
    }
}


async function lockImage() {
    document.getElementById('pickRandomImageButton').disabled = true;  
    const selectedImage = document.getElementById('randomImage').src;
    const characterName = selectedImage.split('/').pop().split('.')[0];
    
    // Fetch metadata
    const charactersMetadata = await fetchCharacterMetadata();
    
    const character = charactersMetadata.find(char => char.name.toLowerCase() === characterName.toLowerCase());
    
    const characterInfoContainer = document.getElementById('characterInfo');
    const characterDescription = document.getElementById('characterDescription');
    
    if (character) {
        characterDescription.innerHTML = `${character.name} ${character.description}`;
    } else {
        characterDescription.textContent = "No metadata found on this person 😔";
    }
    
    characterInfoContainer.style.display = 'block';
    document.getElementById('timestamp').textContent = `Locked at: ${new Date().toLocaleString()}`;
    document.getElementById('lockButton').style.display = 'none';
    document.getElementById('unlockButton').style.display = 'inline-block';
}

function unlockImage() {
    document.getElementById('randomImage').style.display = 'none';
    document.getElementById('characterInfo').style.display = 'none';
    document.getElementById('timestamp').textContent = '';
    document.getElementById('pickRandomImageButton').disabled = false;
    document.getElementById('unlockButton').style.display = 'none';
    document.getElementById('lockButton').style.display = 'none';
    document.getElementById('lockContainer').style.display = 'none';
}

function toggleNotepad() {
    const notepad = document.getElementById("notepad");
    const notepadText = document.getElementById("notepadText");
    const minimizeButton = document.getElementById("minimizeButton");
    const expandButton = document.getElementById("expandButton");

    const isHidden = notepadText.style.display === "none";
    notepad.style.height = isHidden ? "200px" : "30px";
    notepadText.style.display = isHidden ? "block" : "none";
    minimizeButton.style.display = isHidden ? "inline" : "none";
    expandButton.style.display = isHidden ? "none" : "inline";
}

function expandNotepad() {
    toggleNotepad();
}

loadImages();
