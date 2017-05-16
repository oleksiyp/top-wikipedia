import './App.scss';
import React, { Component } from 'react';
import Toolbar from 'react-md/lib/Toolbars';
import Helmet from 'react-helmet';
import Button from 'react-md/lib/Buttons/Button';
import DatePicker from 'react-md/lib/Pickers/DatePickerContainer';
import Paper from 'react-md/lib/Papers';
import ListItem from 'react-md/lib/Lists/ListItem';
import Avatar from 'react-md/lib/Avatars';
import Drawer from 'react-md/lib/Drawers';
import Divider from 'react-md/lib/Dividers';
import CardTitle from 'react-md/lib/Cards/CardTitle';
import Media from 'react-md/lib/Media/Media';
import MediaOverlay from 'react-md/lib/Media/MediaOverlay';
import axios from 'axios';
import update from 'react-addons-update';
import moment from 'moment';
import Swipeable from 'react-swipeable'
import LazyLoad from 'react-lazyload';

class DateNavigator extends Component {
  constructor(props) {
    super(props);
    this.state = {hasLimits: false, value: null, limits: {min: null, max: null}};
    this.pickerChanged = this.pickerChanged.bind(this);
    this.backButton = this.backButton.bind(this);
    this.forwardButton = this.forwardButton.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.hasBackPages = this.hasBackPages.bind(this);
    this.hasForwardPages = this.hasForwardPages.bind(this);
  }

  componentDidMount() {
    axios.get(this.props.limitsUrl)
      .then(res => {
        const parseDate = (str) => moment(str, "YYYYMMDD").toDate();
        const limits = {min: parseDate(res.data.min), max: parseDate(res.data.max)}
        this.setState(update(this.state, {$merge: {hasLimits: true, limits: limits}}));
        this.changeDate(moment(this.props.value));
      });
    document.addEventListener("keydown", this.handleKeyDown, false);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(update(this.state, {$merge:
      {value: nextProps.value}
    }));
  }

  handleKeyDown(event) {
    if(event.keyCode === 37) {
      this.backButton();
    }
    if (event.keyCode === 39) {
      this.forwardButton();
    }
  }

  backButton() {
    this.changeDate(moment(this.state.value).subtract(1, 'days'));
  }

  forwardButton() {
    this.changeDate(moment(this.state.value).add(1, 'days'));
  }

  changeDate(dateObject) {
    if (!this.state.hasLimits) return;

    dateObject = moment.max(dateObject, moment(this.state.limits.min));
    dateObject = moment.min(dateObject, moment(this.state.limits.max));

    if (this.state.value != null && moment(this.state.value).isSame(dateObject)) {
      return;
    }

    if (this.props.onChange) {
      this.props.onChange(dateObject.toDate());
    } else {
      this.setState(update(this.state, {$merge:
        {value: dateObject}
      }));
    }
  }

  pickerChanged(dateString, dateObject, event) {
    this.changeDate(moment(dateObject));
  }

  hasBackPages() {
    return this.state.hasLimits && moment(this.state.limits.min).isBefore(this.state.value)
  }

   hasForwardPages() {
    return this.state.hasLimits && moment(this.state.limits.max).isAfter(this.state.value)
  }

  render() {
    return (
      <div className="md-cell md-cell--12">
      <div style={{float:"left", paddingTop: "2px"}}>
       <Button
         icon
         secondary
         disabled={!this.hasBackPages()}
         onClick={this.backButton}
         iconClassName="fa fa-chevron-circle-left fa-2x"/>
      </div>
      <div style={{float:"left", width: "9em"}}>
       <DatePicker
         id="date"
         inline={true}
         fullWidth={false}
         disabled={!this.state.hasLimits}
         value={this.state.value}
         minDate={this.state.limits.min}
         maxDate={this.state.limits.max}
         onChange={this.pickerChanged} />
     </div>
     <div style={{float:"left", paddingTop: "2px"}}>
      <Button
        icon
        secondary
        disabled={!this.hasForwardPages()}
        onClick={this.forwardButton}
        iconClassName="fa fa-chevron-circle-right fa-2x"/>
     </div>
     </div>
    );
  }
}


class NewsSidePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {newsDrawerVisible: false};
    this.toggleNewsDrawer = this.toggleNewsDrawer.bind(this);
  }

  toggleNewsDrawer(visible) {
    this.setState({newsDrawerVisible: visible});
  }

  render() {
    const news = this.props["news"] ? this.props.news : [];
    const newsList = news.map((news, i) => {
      return (
            <Paper zDepth={1} className="md-grid md-cell md-cell--12">
              <div className="md-cell md-cell--12">
                <Button label={news.title} onClick={() => window.location = news.url} />
              </div>
              <div className="md-cell md-cell--12">
                <Media aspectRatio="4-3">
                  <img src={news.urlToImage} role="presentation" />
                </Media>
              </div>
              <div className="md-cell md-cell--12">
                {news.description}
              </div>
            </Paper>
        );
    });
    newsList.push(<Divider key="div" />);
    newsList.push(<Button key="poweredby"
               href="https://newsapi.org"
               primary
               style={{float: "right"}}
               label="Powered by newsapi.org" /> );

    return (
       <Drawer
         visible={this.state.newsDrawerVisible}
         position="left"
         closeOnNavItemClick={false}
         navItems={newsList}
         onVisibilityToggle={this.toggleNewsDrawer}
         type={Drawer.DrawerTypes.TEMPORARY}
         style={{ zIndex: 100 }}
         className="md-grid"
         header={
             <Toolbar
               title={this.props.title}
               actions={<Button icon onClick={() => this.toggleNewsDrawer(false)}>arrow_back</Button>}
               className="md-divider-border md-divider-border--bottom"
             /> }
         />);
  }
}

class Card extends Component {

  render() {
    const item = this.props.item;
    return (
      <Paper key={"paper"+item.position} zDepth={1} className="md-cell md-cell--2" style={{textAlign: "center", paddingTop: "1em", paddingBottom: "1em"}}>
        <LazyLoad height="200px">
          <div style={{maxHeight: "26em", overflow: "hidden"}}>
            <img src={item.thumbnail} alt={item.label} style={{width: "88%"}} />
          </div>
        </LazyLoad> <br/>
          #{item.position+1}
          &nbsp; {item.label} ({item.lang})
         <br/> <br/>
         <Button tooltipLabel="Open in Wikipedia"
           href={"https://" + item.lang + ".wikipedia.org/wiki/Special:Search?search=" + item.label}
           target="topic-window"
           icon
           secondary
           iconClassName="fa fa-wikipedia-w fa-lg" />
         {
           item.news.length !== 0 ?
            <Button tooltipLabel="Open News"
             onClick={() => this.refs.newsSidePanel.toggleNewsDrawer(true)}
             target="topic-window"
             icon
             secondary
             iconClassName="fa fa-newspaper-o fa-lg" /> : ""
         }
         <Button tooltipLabel="Open in Google News"
           href={"https://google.com/search?tbm=nws&q=" + item.label}
           target="topic-window"
           icon
           secondary
           iconClassName="fa fa-google fa-lg" />
         <Button tooltipLabel="Open in YouTube"
           href={"https://www.youtube.com/results?q=" + item.label}
           target="topic-window"
           icon
           secondary
           iconClassName="fa fa-youtube fa-lg" />

         <NewsSidePanel ref="newsSidePanel" news={item.news} title={item.label} />
      </Paper>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {loaded: false, date: this.props.date};
    this.dateChanged = this.dateChanged.bind(this);
    this.swippedLeft = this.swippedLeft.bind(this);
    this.swippedRight = this.swippedRight.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(update(this.state, {$merge:
      {date: nextProps.date}
    }));
    this.dateChanged(moment(nextProps.date, "YYYYMMDD"));
  }

  dateOrToday() {
    const date = moment(this.state.date, "YYYYMMDD");
    if (date.isValid()) {
      return date.toDate();
    }
    return new Date();
  }

  dateChanged(dateObject) {
    const date = moment(dateObject).format("YYYYMMDD");
    this.setState(update(this.state, {$merge:
      {loaded: false, date: date}
    }));
    axios.get('daily_cat/' + date + '.json')
    .then(res => {
      history.pushState(null,null,'#' + date);
      window.ga('set', 'page', location.pathname+location.search+location.hash);
      window.ga('send', 'pageview');
      this.setState(update(this.state, {$merge:
        {loaded: true, dailyCats: res.data}
      }));
    });
  }

  swippedLeft(e) {
    this.refs.dateNav.forwardButton();
  }

  swippedRight(e) {
    this.refs.dateNav.backButton();
  }

  render() {
    var items = "";
    var cnt = 1;
    if (this.state.loaded) {
      items = this.state.dailyCats.map((cat, i) => {
        const recordPapers = cat.records.map((record, j) =>
          <Card key={"card" + cnt++} item={record} />
        );
        return (
          <div key={"card" + i} className="md-grid">
            <div className="md-cell md-cell--12">
              <h4>{cat.category} ({cat.lang})</h4>
            </div>
            {recordPapers}
          </div>
        );
      });
    }

    return (
      <div>
        <Helmet title="Daily wikipedia top" />
        <Toolbar
          colored
          title="Daily wikipedia top"
         />

       <Swipeable onSwipedLeft={this.swippedLeft}  onSwipedRight={this.swippedRight} delta={25} flickThreshold={0.7} >
          <div className="md-grid">
            <DateNavigator ref="dateNav" value={this.dateOrToday()} limitsUrl="daily/limits.json" onChange={this.dateChanged} />
          </div>
          {items}
        </Swipeable>
      </div>
    );
    }
}

export default App;
