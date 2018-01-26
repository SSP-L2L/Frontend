# User Manual
[TOC]

##Initialize the configuration
###Create And Publish App
- Click the`Apps`![Click the Apps](./clickApps.png)
- Click the`Create App`
- Then enter App name and key.
- Finally,click`Create new App definition`![Create App](./clickCreateApp.png)![Alt text](./Create new app definition.png)
- Click the`Edit included models`![Alt text](./clickEdit included models.png)
- Checked the BPMN Model,then click `close`![Alt text](./select Models included in the app definition.png)
- Click Top left corner`Save icon`to save App![Alt text](./save App definition details.png)
- Click and enter the SPS App![Alt text](./click in SPS.png)
- Click `Publish`to publish App ![Alt text](./Publish.png)
###Create Users
- Click`Identity management`![Alt text](./click_identify_management.png)
- Click `Users`
- Then,click `Create user`to create user 
- **Note:You should create three users as in Figure 3**![Alt text](./Createuser.png)![Alt text](./enter_Create_user.png)
- **Note:**
  - **Admin control the flow of the vessel**
  - **Jack control the flow of the manager**
  - **Tom control the flow of the supplier**
  - **Gonzo control the flow of the wagon**
###Before use
- **Please use at least two computers for Demonstration**
- **Or make sure that each user page takes up a different category of browser independently, and the cut remains constant**
- **Please ensure that each user and map page is not minimized in the process of using**
##Use App
###Map
1. Here is the console, you can specify the geographical location manager and supplier
2. Here is the demo start button, click to start the demo
3. Here is the application of goods button, click on the required goods![Alt text](./F.png)
#### Console
- Enter the POI in Manager or Supplier  to automatically show the destination on the map![Alt text](./console.png)![Alt text](./show.png)

####Start Button
- Click the Start button to enter the crew and vessel number, it can start the vessel process and show the route and ports on the map.In addition, there is a toaster on the map that prompts the presentation of business information.![Alt text](./选择轮班.png)![Alt text](./开始demo.png)
- At the beginning, the port icon is all lit, indicating that it is possible to pick up the goods, the port icon passing by the ship will be dimmed, and will be dimmed when the port can not lift the goods![Alt text](./QQ20180126-150111.png)![Alt text](./QQ20180126-161207.png)

#### Apply Button
- Click the Apply button, select the required goods in the pop-up box, submitted by the manager for approval![Alt text](./选择货物.png)
###Vessel
- Login using admin,click `SPS`,enter into Tasks&Process page![Alt text](./TasksProcess.png)
####Tasks
- When starting the demo, the task page will display information about the vessel![Alt text](./QQ20180126-143515.png)
- When the ship is docked / anchored at a port, the task page displays this information and allows for an delay or extension
- When click`延误`,a delay input box will be displayed. After entering the time, click `OK` to achieve the delay
- Also,enter the extension time and click `OK` to achieve the extension
- Delays and extension can be entered simultaneously,And both can be negative,but the absolute value of the negative values for delays and extension must be less than the remaining departure time![Alt text](./QQ20180126-143554.png)![Alt text](./QQ20180126-143648.png)
####Process
- The process page shows the current execution of the task and record the completed task. After each demo, enter the process page for each user and click`Cancel process` to clear the record![Alt text](./QQ20180126-152011.png)
###Manager
- Login using Jack,click `SPS`,enter into Tasks&Process page![Alt text](./QQ20180126-154024.png)
####Tasks
- When submitting an application, the manager represented by Jack will receive a task,click complete to finish the approving![Alt text](./QQ20180126-153822.png)
- Then go to the next task,click complete to finish the ordering,then the supplier will receive an order.![Alt text](./QQ20180126-155727.png)
####Process
- The process page shows the current execution of the task and record the completed task. After each demo, enter the process page for each user and click`Cancel process` to clear the record![Alt text](./QQ20180126-153849.png)
###Supplier
- Login using Tom,click `SPS`,enter into Tasks&Process page ![Alt text](./QQ20180126-160534.png)
####Tasks
- When supplier receive an order,supplier to arrange delivery, click complete to finish the arranging task and enter the shipping task ![Alt text](./QQ20180126-161116.png)
- When in shipping task,click complete to finish the shipping task![Alt text](./QQ20180126-161136.png)
- The car on the map begins to be delivered from the supplier to the designated port on the planned route,The unexpected situation encountered by the wagon on the road will show through toaster![Alt text](./QQ20180126-161216.png)
####Process
-  The process page shows the current execution of the task and record the completed task. After each demo, enter the process page for each user and click`Cancel process` to clear the record![Alt text](./QQ20180126-161151.png)
###Wagon
- Login using Gonzo,click `SPS`,enter into Tasks&Process page![Alt text](./QQ20180126-171851.png)
####Task
- When supplier finish shipping task,  and the running task start, the task page will display information about the wagon![Alt text](./QQ20180126-171240.png)
####Process
The process page shows the current execution of the task and record the completed task![Alt text](./QQ20180126-171249.png)



