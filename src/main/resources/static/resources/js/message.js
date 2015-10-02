
function ApplicationModel(stompClient) {
  var self = this;

  self.friends = ko.observableArray();
  self.username = ko.observable();
  self.conversation = ko.observable(new ImConversationModel(stompClient,this.username));
  self.notifications = ko.observableArray();

  self.connect = function() {
      stompClient.connect({}, function(frame) {

      console.log('Connected ' + frame);
      self.username(frame.headers['user-name']);

//      self.friendSignin({"username": "luke"});

      stompClient.subscribe("/user/queue/errors", function(message) {
          self.pushNotification("Error " + message.body);
      });
      stompClient.subscribe("/app/users", function(message) {
          var friends = JSON.parse(message.body);

          for(var i=0;i<friends.length;i++) {
              self.friendSignin({"username": friends[i]});
          }
      });
      stompClient.subscribe("/topic/friends/signin", function(message) {
          var friends = JSON.parse(message.body);

          for(var i=0;i<friends.length;i++) {
              self.friendSignin(new ImFriend({"username": friends[i]}));
          }
      });
      stompClient.subscribe("/topic/friends/signout", function(message) {
          var friends = JSON.parse(message.body);

          for(var i=0;i<friends.length;i++) {
              self.friendSignout(new ImFriend({"username": friends[i]}));
          }
      });
      stompClient.subscribe("/user/queue/messages", function(message) {
          self.conversation().receiveMessage(JSON.parse(message.body));
      });
    }, function(error) {
       self.pushNotification(error)
      console.log("STOMP protocol error " + error);
    });
  }

  self.pushNotification = function(text) {
    self.notifications.push({notification: text});
    if (self.notifications().length > 5) {
      self.notifications.shift();
    }
  }

  self.logout = function() {
    stompClient.disconnect();
    window.location.href = "../logout.html";
  }

  self.friendSignin = function(friend) {
    self.friends.push(friend);
  }

  self.friendSignout = function(friend) {
    var r = self.friends.remove(
      function(item) {
        item.username == friend.username
      }
    );
    self.friends(r);
  }
}

function ImFriend(data) {
  var self = this;

  self.username = data.username;
}

function ImConversationModel(stompClient,from) {
  var self = this;
  self.stompClient = stompClient;
  self.from = from;
  self.to = ko.observable(new ImFriend('null'));
  self.draft = ko.observable('')

  self.messages = ko.observableArray();

  self.receiveMessage = function(message) {
    var elem = $('#chat');
    var isFromSelf = self.from() == message.from;
    var isFromTo = self.to().username == message.from;
    if(!(isFromTo || isFromSelf)) {
        self.chat(new ImFriend({"username":message.from}))
    }

    var atBottom = (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight());

    self.messages.push(new ImModel(message));

    if (atBottom)
        elem.scrollTop(elem[0].scrollHeight);
  };

  self.chat = function(to) {
    self.to(to);
    self.draft('');
    self.messages.removeAll()
    $('#trade-dialog').modal();
  }

  self.send = function() {
    var data = {
      "created" : new Date(),
      "from" : self.from(),
      "to" : self.to().username,
      "message" : self.draft()
    };
    var destination = "/app/im"; // /queue/messages-user1
    stompClient.send(destination, {}, JSON.stringify(data));
    self.draft('');
  }
};

function ImModel(data) {
  var self = this;

  self.created = new Date(data.created);
  self.to = data.to;
  self.message = data.message;
  self.from = data.from;
  self.messageFormatted = ko.computed(function() {
      return self.created.getHours() + ":" + self.created.getMinutes() + ":" + self.created.getSeconds() + " - " + self.from + " - " + self.message;
  })
};

