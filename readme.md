# Chargebee CSV Editor

> Note: This is an internal tool that we use @Holstee. It's very specific to our needs for manipulating a CSV programatically.

We work with chargebee to export "Welcome-Kits" once a week as well as a dump of our current subscribers on the 15th of every month. I was tasked with the _glorious_ job of downloading and editing the CSV every month. From me the CSV goes right to the fulfiller, who really only need the address information. The main things that go into readying a "Welcome-Kit" CSV is as follows.

* removing rows where "subscriptions.status" column is "Cancelled"
* removing rows where "subscriptions.status" column is "Future"
* removing rows where "subscriptions.created_at" is between a start and end date
* removing columns that the fulfillment center doesn't need

The app takes a CSV and will output a new CSV in the same directory with the following naming convention.

```
Welcome Kit YYMMDD-YYMMDD.csv
```

To initiate a new Welcome Kit use:

```
node ./welcome-kit
```

Here's what the whole thing looks like:

![screenshot](https://raw.githubusercontent.com/holstee/node-chargebee-csv/screenshots/example1.png)

