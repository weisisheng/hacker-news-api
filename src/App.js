import React, { Component, Fragment } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import "./App.less";
import "./css/global.less";
import "./css/export.less";

// -----------FRONT-END API-----------
import api from "./api";

// -------------COMPONENTS-------------
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import StoryList from "./components/StoryList/StoryList";
import SelectedStory from "./components/SelectedStory/SelectedStory";

class App extends Component {
  constructor() {
    super();
    this.state = {
      storiesIdArray: [],
      stories: [],
      pageNumber: 1,
      loading: false,
      selectedStoryIndex: 0,
      apiError: false
    };
  }

  getTopStories = () => {
    api
      .fetchTopStories()
      .then(res =>
        // Fetching an array of top story id's and pushing 50 of them to component state (for potential future use)
        this.setState(
          {
            storiesIdArray: res.data.slice(0, 50),
            loading: true
          },
          () => this.getIndividualStories()
        )
      )
      .catch(err => this.setState({ apiError: true }));
  };

  getIndividualStories = () => {
    const { pageNumber } = this.state;

    let storyInternalId = 1,
      sliceStart = 0,
      sliceEnd = 10;

    // Depending on page number, updating stories' serial numbers and start/end points of Array slice
    if (pageNumber > 1) {
      storyInternalId = pageNumber * 10 - 9;
      sliceStart = pageNumber * 10 - 10;
      sliceEnd = pageNumber * 10;
    }

    // Fetching individual stories based on id's from this.state.storiesIdArray
    this.state.storiesIdArray
      // Looping through the array and fetching only first 10 stories for page 1
      .slice(sliceStart, sliceEnd)
      .forEach(storyId =>
        api
          .fetchIndividualStory(
            `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`
          )
          .then(res => {
            const story = res.data;

            // Creating an object for each story
            let storyObject = {};

            storyObject.apiId = story.id;
            storyObject.internalId = storyInternalId++;
            storyObject.comments = story.kids;
            storyObject.time = story.time;
            storyObject.title = story.title;
            storyObject.url = story.url;
            storyObject.user = story.by;

            // Populating component state with Stories array
            this.setState({
              stories: [...this.state.stories, storyObject],
              loading: false
            });
          })
          .catch(err => console.log(err))
      );
  };

  navigateToAnotherPage = option => {
    // Option represent a Next or Previous page
    switch (option) {
      case "previous":
        this.setState(
          {
            pageNumber: this.state.pageNumber - 1,
            stories: [],
            loading: true
          },
          () => this.getIndividualStories()
        );
        break;
      case "next":
        this.setState(
          {
            pageNumber: this.state.pageNumber + 1,
            stories: [],
            loading: true
          },
          () => this.getIndividualStories()
        );
        break;
      default:
        return;
    }
  };

  componentWillMount() {
    this.getTopStories();
  }

  render() {
    const { stories, pageNumber, loading, apiError } = this.state;

    return (
      <Fragment>
        <Navbar />
        <div className="view-container">
          {apiError ? (
            <div className="error-container">
              <img
                src="/img/error.png"
                alt="no-connection"
                className="error-image"
              />
              <h4>
                <strong>Oops!</strong> An unexpected error seems to have
                occured. <br /> Why not try refreshing the page?
              </h4>
            </div>
          ) : (
            <Switch>
              {/* Route for Home page */}
              <Route
                exact
                path="/"
                render={() => (
                  <StoryList
                    stories={stories}
                    navigateToAnotherPage={this.navigateToAnotherPage}
                    pageNumber={pageNumber}
                    loading={loading}
                  />
                )}
              />
              {/* Route for Selected story */}
              <Route
                exact
                path="/story/:storyId"
                render={props => <SelectedStory stories={stories} {...props} />}
              />
              {/* Redirect to Home page if users manually type things in URL */}
              <Redirect to="/" />;
            </Switch>
          )}
        </div>
        <Footer />
      </Fragment>
    );
  }
}

export default App;
