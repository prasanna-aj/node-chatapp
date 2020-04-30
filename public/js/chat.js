const socket = io();

//ELEMENTS

const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $SendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// socket.on("countUpdated", (count) => {
//   console.log("count has been updated", count);
// });

// document.querySelector("#increment").addEventListener("click", () => {
//   console.log("clicked");
//   socket.emit("increment");
// });
//TEMPLATES

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  //new message element
  const $newMessage = $messages.lastElementChild;
  //Height of new/last message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //visibile height
  const visibileHeight = $messages.offsetHeight;
  //Height of messages container
  const containerHeight = $messages.scrollHeight;
  //How far Scrolled
  const ScrollOffset = $messages.scrollTop + visibileHeight;

  if (containerHeight - newMessageHeight <= ScrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", (msg) => {
  console.log(msg);
  const html = Mustache.render(messageTemplate, {
    username: msg.username,
    message: msg.text, //message is the variable set in index.html
    createdAt: moment(msg.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (message) => {
  // console.log(url);
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault(); //prevent refresh
  //disable
  $messageFormButton.setAttribute("disabled", "disabled");
  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, (error) => {
    //enable
    $messageFormButton.removeAttribute("disabled");
    //remove form input after sending
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      console.log(error);
    }
    console.log("Message delivered");
  });
});

document.querySelector("#send-location").addEventListener("click", () => {
  $SendLocationButton.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    return alert("Not supported. Please Update your browser");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    // console.log(position);
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $SendLocationButton.removeAttribute("disabled");
        console.log("Location shared");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
