# README
## Table Of Contents
-   [Demo](#demo)
-   [Run in WebStorm](#run-in-webstorm)

## Demo
[demo video in dropbox](https://www.dropbox.com/s/gi2rrvfkl17vlng/vessel.mp4?dl=0)

## Run in `WebStrom`
1.  Download development tool:

    IDE: [WebStrom](http://www.jetbrains.com/webstorm/)
    
    Node.js 8.9.4LTS [Node.js](https://nodejs.org/en/)

2.  Clone Source Code:

    `git clone --recursive git@github.com:sonnyhcl/Frontend.git`

3.  Open Project in WebStrom:  
    -   Choose `Open Project`
    -   Choose the `directory path` which you clone the source code
    ![open](app/images/webstorm_open_project.png)
    -   Choose `run npm install` Wait for npm to download dependencies
    ![npm install](app/images/webstorm_npm_install.png)

4.  Edit Configuration:
    -   Click `Run`
    -   Choose `Edit Configuration`
    ![edit_configurations](app/images/webstorm_edit_configurations.png)
    -   Click the `+` in left-up corner
    -   Choose `npm`
    ![add_npm](app/images/webstorm_add_npm.png)
    -   Configure npm settings
    ![Alt text](app/images/webstorm_apply.png)
    
5.  Run Application:
    -   Run Angular Application and visit [http://localhost:8000](http://localhost:8000) in the browser
    ![start](app/images/webstorm_start.png)
    ![Alt text](app/images/webstorm_map.png)

## Dependencies
-   [`Vessel Backend`](https://www.github.com/sonnyhcl/Backend/tree/lambda)
    
    > Attention: In order to perform as [demo](#demo) shows, The `Activiti Backend` project must be coordinated with the `Vessel Backend` project.

-   [`Coordinator`](https://github.com/sonnyhcl/coordinator)

    This repo simulates aws lambda locally.