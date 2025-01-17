import React from "react";
import "./SimilarNews.css";
import { Link } from "react-router-dom";
import { createBrowserHistory } from 'history';


import { ReactComponent as FoxNews } from "../../../icons/fox-3.svg";
import { ReactComponent as BBC } from "../../../icons/bbc-2.svg";
import { ReactComponent as CNN } from "../../../icons/cnn-logo.svg";

const history = createBrowserHistory();

class SimilarNews extends React.Component {
    constructor(props) {
        super(props);
    }



    render() {
        let Svg = BBC;
        let fill = "black";
        if (this.props.RSSTag === "FOX News") {
            Svg = FoxNews;
            fill = "rgba(0,101 ,152, 1)"
        }
        else if (this.props.RSSTag === "BBC") {
            Svg = BBC;
        }
        else if (this.props.RSSTag === "CNN") {
            Svg = CNN;
            fill = "rgba(234,0 ,0, 1)"
        }

        let Categoris = this.props.Category.split("-");
        let Category="";
        let max = 0;
        for (let i = 0; i < Categoris.length; i++) {
            if (Categoris[i].split("*")[1] > max) {
                max = Categoris[i].split("*")[1];
                Category=Categoris[i].split("*")[0];
            }
        }

        let color = "transparent";
        if (Category === "SCIENCE") {
            color = "rgba(0,250,250,0.75)";
        }
        else if (Category === "ARTS & CULTURE") {
            color = "rgba(100,200,150,0.75)";
        }
        else if (Category === "BUSINESS") {
            color = "rgba(200,40,20,0.75)";
        }
        else if (Category === "TRAVEL") {
            color = "rgba(40,200,0,0.75)";
        }
        else if (Category=== "POLITICS") {
            color = "rgba(255,50,50,0.75)";
        }
        else if (Category === "HEALTHY LIVING") {
            color = "rgba(200,250,250,0.75)";
        }
        else if (Category === "FOOD & DRINK") {
            color = "rgba(250,150,100,0.75)";
        }
        else if (Category === "CRIME") {
            color = "rgba(255,0,30,0.75)";
        }
        else if (Category === "HOME & LIVING") {
            color = "rgba(255,0,100,0.75)";
        }
        else if (Category === "RELIGION") {
            color = "rgba(155,75,75,0.75)";
        }
        else if (Category === "STYLE & BEAUTY") {
            color = "rgba(155,255,105,0.75)";
        }
        else if (Category === "SPORTS") {
            color = "rgba(30,100,255,0.75)";
        }
        else if (Category === "ENVIRONMENT") {
            color = "rgba(10,255,25,0.75)";
        }
        else if (Category === "ENTERTAINMENT") {
            color = "rgba(250,250,55,0.75)";
        }
        else if (Category === "EDUCATION") {
            color = "rgba(250,0,255,0.75)";
        }

        return (
             <Link to={"/news/" + this.props.ID} style={{ textDecoration: "none", color: "black" }}>
             <div className="Outer-SimilarNews" onClick={this.handleClick} >
                 <div className="SimilarNews-Content">
                     <div className="SimilarNews-SvgSpace">
                         <a style={{ fill: fill }}><Svg></Svg></a>
                         <div style={{marginLeft:"auto",fontSize:"20px",marginBottom:"4px"}}>
                            {(this.props.similarity * 100).toPrecision(4)}%
                        </div>
                     </div>

                     <div className="SimilarNews-Title" >
                         &emsp;{this.props.title}
                     </div>
                     <div className="SimilarNews-pubDate" style={{ color: fill, textAlign: "right", marginTop: "10px" }}>{this.props.pubDate}</div>

                     <div className="SimilarNews-line"></div>
                 </div>
                 <div className="SimilarNews-Category" style={{ background: color }}>

                 </div>
             </div>
         </Link>
        )
    }
}

export default SimilarNews;