const repoConfig = {
    owner: "scottctram",
    name: "guesswho",
    branch: "main",
    paths: {
        scole: "images/scoleparty",
        other: "images/otherparty",
        characters: "data/characters.json"  // Path to the metadata file
    }
};

// Fetch images from GitHub
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

// Fetch character metadata from JSON
async function fetchCharacterMetadata() {
    try {
        const response = await fetch(`https://api.github.com/repos/${repoConfig.owner}/${repoConfig.name}/contents/${repoConfig.paths.characters}?ref=${repoConfig.branch}`);
        if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
        
        const data = await response.json();
        const jsonData = await fetch(data[0].download_url);
        return await jsonData.json();
    } catch (error) {
        console.error("Error fetching character metadata:", error);
        return [];
    }
}

// Load images and metadata
async function loadImages() {
    const [scoleImages, otherImages] = await Promise.all([
        fetchImages(repoConfig.paths.scole),
        fetchImages(repoConfig.paths.other)
    ]);
    
    generateGrid(scoleImages, 'scoleGrid');
    generateGrid(otherImages, 'otherGrid');
}

// Generate the image grid
function generateGrid(images, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = images
        .map(image => `<img src="${image}" data-filename="${image}" onclick="toggleSelection(this)">`)
        .join('');
}

// Toggle selection of an image
function toggleSelection(imgElement) {
    imgElement.classList.toggle('deselected');
}

// Toggle the selection of other party images
function toggleOtherParty() {
    const images = document.querySelectorAll('#otherGrid img');
    const allDeselected = Array.from(images).every(img => img.classList.contains('deselected'));
    
    images.forEach(img => img.classList.toggle('deselected', !allDeselected));
    document.getElementById('toggleOtherPartyButton').textContent = allDeselected ? 'Deselect Other Party' : 'Reselect Other Party';
}

// Pick a random image from the grid
async function pickRandomImage() {
    const availableImages = [...document.querySelectorAll('.grid img:not(.deselected)')]
        .map(img => img.dataset.filename);
    
    if (availableImages.length === 0) return alert('No images selected!');
    
    const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
    document.getElementById('randomImage').src = randomImage;
    document.getElementById('randomImage').style.display = 'block';
    document.getElementById('lockContainer').style.display = 'block';
    document.getElementById('lockButton').style.display = 'inline-block';
}

// Lock the selected image and show metadata
async function lockImage() {
    document.getElementById('pickRandomImageButton').disabled = true;
    const selectedImage = document.getElementById('randomImage').src;
    const characterName = selectedImage.split('/').pop().split('.')[0];  // Assuming name is in the filename
    
    // Fetch metadata
    const charactersMetadata = await fetchCharacterMetadata();
    
    // Find metadata for the locked character
    const character = charactersMetadata.find(char => char.name.toLowerCase() === characterName.toLowerCase());
    
    const characterInfoContainer = document.getElementById('characterInfo');
    const characterDescription = document.getElementById('characterDescription');
    
    if (character) {
        characterDescription.textContent = `Name: ${character.name}\nAge: ${character.age}\nHeight: ${character.height}\nGender: ${character.gender}\nDescription: ${character.description}`;
    } else {
        characterDescription.textContent = "No info found";
    }
    
    characterInfoContainer.style.display = 'block';
    
    document.getElementById('timestamp').textContent = `Locked at: ${new Date().toLocaleString()}`;
    document.getElementById('lockButton').style.display = 'none';
    document.getElementById('unlockButton').style.display = 'inline-block';
}

// Unlock the image and reset everything
function unlockImage() {
    document.getElementById('randomImage').style.display = 'none';
    document.getElementById('timestamp').textContent = '';
    document.getElementById('pickRandomImageButton').disabled = false;
    document.getElementById('unlockButton').style.display = 'none';
}

// Toggle the visibility of the notepad
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

// Expand the notepad
function expandNotepad() {
    toggleNotepad();
}

loadImages();
