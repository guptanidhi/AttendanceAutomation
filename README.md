# Attendance Automation

This project is generating output file for attendance from Master sheet and attendance sheets.

## Step - 1

Clone project form  `npm install`.

## Step - 2

Run `npm install` to install all project dependency.

## Step - 3

Make a Copy of `cts-w1` folder and rename it as like `cts-w2 or mean-w1 or mean-w1 etc...`.

## Step - 4

Folder Structure will be like this

    Attendance Project Folder Structure
    |
    ├── cts-w1          // Module for cts - wave 1
    |
    ├── cts-w2          // Module for cts - wave 2
    |
    ├── node_modules    // Dependencies
    |
    ├──.gitignore      // Configuration of ignoring file to commit into git
    |
    ├── package.json    // Defined all dependency    
    |
    └── README.md       // Steps for generating combined attendance sheet.


Subfolder structure

    cts-w1          // Main Folder for specific wave
    |
    ├── attendance  // Contains all attendance sheet datewise in csv format
    |
    ├── master.csv  // Master sheet for specific wave name should be like(master.csv).
    |
    ├── output.csv  // Combined attendance sheet.
    |
    └── app.js      // Complete logic for generating combined attendance sheet.

## Step - 5

In `cts-w2` folder keep master list of specific wave `master.csv` name should be like this only.


## Step - 6

In `cts-w2` folder we have `attendance` folder in which keep all attendance sheets in csv format name it like `19-Dec.csv, 20-Dec.csv etc...`.


## Step - 7

From command prompt change directory to particular folder with command `cd cts-w2` and run command `node app.js` to generate combined attendance sheet.