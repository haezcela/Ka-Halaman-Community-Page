// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCotzSrU7iRJV685q8uceW5kve4kYGkhWA",
  authDomain: "ka-halaman-505b5.firebaseapp.com",
  projectId: "ka-halaman-505b5",
  storageBucket: "ka-halaman-505b5.appspot.com",
  messagingSenderId: "310047835427",
  appId: "1:310047835427:web:face5a3286c95b10ed3896",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const storage = firebase.storage();

const form = document.getElementById("imageForm");
const imageContainer = document.getElementById("imageContainer");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("image").files[0];
  const caption = document.getElementById("caption").value;
  const storageRef = storage.ref();
  const imageRef = storageRef.child(file.name);

  try {
    await imageRef.put(file);
    const imageUrl = await imageRef.getDownloadURL();

    // Save image URL, caption, username, and time to Firestore database
    await db.collection("images").add({
      imageUrl: imageUrl,
      caption: caption,
      username: "John Doe", // Hardcoded username
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      upvotes: [],
      downvotes: [],
      comments: [], // Initialize comments array
    });

    alert("Image uploaded successfully!");
    form.reset();
    displayPosts();
  } catch (error) {
    console.error("Error uploading image: ", error);
    alert("Error uploading image. Please try again.");
  }
});

// Function to display uploaded images
async function displayPosts() {
  imageContainer.innerHTML = ""; // Clear previous images

  const imagesSnapshot = await db
    .collection("images")
    .orderBy("createdAt", "desc")
    .get();
  imagesSnapshot.forEach((doc) => {
    const imageUrl = doc.data().imageUrl;
    const caption = doc.data().caption;
    const username = doc.data().username;
    const createdAt = doc.data().createdAt.toDate(); // Convert Firestore timestamp to JavaScript Date object
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Uploaded Image";

    const captionDiv = document.createElement("div");
    captionDiv.classList.add("caption-container");
    captionDiv.innerHTML = `<div><strong>${username}</strong></div><div>${createdAt.toLocaleString(
      "en-US",
      { timeZone: "UTC" }
    )}</div><div>${caption}</div>`;

    const containerDiv = document.createElement("div");
    containerDiv.appendChild(captionDiv);
    containerDiv.classList.add("image-container-item");
    containerDiv.appendChild(img);

    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.innerText = "Delete";
    deleteButton.classList.add("btn", "btn-small", "btn-danger");
    deleteButton.addEventListener("click", async () => {
      // Delete post from Firestore
      await db.collection("images").doc(doc.id).delete();

      // Delete image from Storage
      const imageRef = storage.refFromURL(imageUrl);
      try {
        await imageRef.delete();
        console.log("Image deleted successfully");
      } catch (error) {
        console.error("Error deleting image: ", error);
      }

      // Refresh images
      displayPosts();
    });

    // Create upvote button
    const upvoteButton = document.createElement("button");
    upvoteButton.innerText = "Upvote";
    upvoteButton.classList.add("btn", "btn-small", "btn-outline-success");
    upvoteButton.addEventListener("click", async () => {
      const userId = "user123"; // Replace with actual user ID
      const upvotes = doc.data().upvotes;
      if (!upvotes.includes(userId)) {
        // Add upvote if user hasn't already upvoted
        upvotes.push(userId);
        await db.collection("images").doc(doc.id).update({ upvotes });
        displayPosts();
      } else {
        alert("You have already upvoted this post.");
      }
    });

    // Create downvote button
    const downvoteButton = document.createElement("button");
    downvoteButton.innerText = "Downvote";
    downvoteButton.classList.add("btn", "btn-small", "btn-outline-danger");
    downvoteButton.addEventListener("click", async () => {
      const userId = "user123"; // Replace with actual user ID
      const downvotes = doc.data().downvotes;
      if (!downvotes.includes(userId)) {
        // Add downvote if user hasn't already downvoted
        downvotes.push(userId);
        await db.collection("images").doc(doc.id).update({ downvotes });
        displayPosts();
      } else {
        alert("You have already downvoted this post.");
      }
    });

    // Create comment input
    const commentInput = document.createElement("input");
    commentInput.setAttribute("type", "text");
    commentInput.setAttribute("placeholder", "Add a comment...");
    commentInput.classList.add("form-control", "mt-2");

    // Create comment button
    const commentButton = document.createElement("button");
    commentButton.innerText = "Comment";
    commentButton.classList.add("btn", "btn-small", "btn-primary", "mt-2");
    commentButton.addEventListener("click", async () => {
      const commentText = commentInput.value.trim();
      if (commentText !== "") {
        const comments = doc.data().comments;
        comments.push({
          userId: "user123", // Replace with actual user ID
          text: commentText,
        });
        await db.collection("images").doc(doc.id).update({ comments });
        displayPosts();
      } else {
        alert("Please enter a comment.");
      }
    });

    // Create comments container
    const commentsContainer = document.createElement("div");
    commentsContainer.classList.add("comments-container", "mt-2");
    // Initialize comments array if it doesn't exist
    const comments = doc.data().comments || [];

    // Iterate over comments if it exists
    comments.forEach((comment) => {
      const commentDiv = document.createElement("div");
      commentDiv.innerHTML = `<strong>${comment.userId}</strong>: ${comment.text}`;
      commentsContainer.appendChild(commentDiv);
    });

    containerDiv.appendChild(deleteButton);
    containerDiv.appendChild(upvoteButton);
    containerDiv.appendChild(downvoteButton);
    containerDiv.appendChild(commentInput);
    containerDiv.appendChild(commentButton);
    containerDiv.appendChild(commentsContainer);

    imageContainer.appendChild(containerDiv);
  });
}

// Initial display of uploaded posts
displayPosts();
