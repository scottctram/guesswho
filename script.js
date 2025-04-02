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
    document.getElementById('toggleOtherPartyButton').textContent = allDeselected ? 'Deselect Other Party' : 'Reselect Other Party';
}

function pickRandomImage() {
    const availableImages = [...document.querySelectorAll('.grid img:not(.deselected)')]
        .map(img => img.dataset.filename);
    
    if (availableImages.length === 0) return alert('No images selected!');
    
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
        
        // Log the metadata to check its structure
        console.log('Character file metadata:', metadata);
        
        // Decode the Base64 content
        const base64Content = metadata.content;
        const decodedContent = atob(base64Content);  // Decode from Base64
        
        // Parse the decoded content into JSON
        const characters = JSON.parse(decodedContent);
        
        // Log the actual character data to ensure it's an array
        console.log('Fetched character data:', characters);
        
        return characters;  // This should now be the array you want
    } catch (error) {
        console.error('Error in fetchCharacterMetadata:', error);
        throw error;
    }
}


async function lockImage() {
    document.getElementById('pickRandomImageButton').disabled = true;
    const selectedImage = document.getElementById('randomImage').src;
    const characterName = selectedImage.split('/').pop().split('.')[0];  // Assuming name is in the filename
    
    // Fetch metadata
    const charactersMetadata = await fetchCharacterMetadata();
    
    // Log the metadata to inspect its structure
    console.log('Fetched Character Metadata:', charactersMetadata);
    
    // Check if it's an array
    if (!Array.isArray(charactersMetadata)) {
        console.error('Error: charactersMetadata is not an array:', charactersMetadata);
        return;
    }
    
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



function unlockImage() {
    // Hide the character info container
    const characterInfoContainer = document.getElementById('characterInfo');
    characterInfoContainer.style.visibility = 'hidden';  // Try visibility instead of display
    characterInfoContainer.style.display = 'none';  // Hide the character info box
    
    // Clear the character description text
    const characterDescription = document.getElementById('characterDescription');
    characterDescription.textContent = '';  // Clear the description
    
    // Hide the random image (assuming it's in #randomImage)
    const randomImage = document.getElementById('randomImage');
    randomImage.style.display = 'none';  // Hide the image
    
    // Clear the timestamp
    document.getElementById('timestamp').textContent = '';
    
    // Enable the pick random image button again
    document.getElementById('pickRandomImageButton').disabled = false;
    
    // Hide the unlock button and show the lock button again
    document.getElementById('unlockButton').style.display = 'none';
    document.getElementById('lockButton').style.display = 'inline-block';
}


function expandNotepad() {
    toggleNotepad();
}

loadImages();
