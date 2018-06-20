<?php
/**
 * Created by PhpStorm.
 * Date: 2018-06-20
 * Time: 09:52
 */
echo "Start time " . round(microtime(true)) . "<br/>";
try {
    $servername = "185.80.130.55";
    $username = "admin_playground";
    $password = "93425672";
    $conn = new PDO("mysql:host=$servername;dbname=admin_playground", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    //$stmt = $conn->prepare("INSERT INTO `test` (`name`, `data`) VALUES (:name, :data)");

    $sql = "INSERT INTO `test` (`name`, `data`) VALUES ('hello', 'world')";
    for ($i = 0; $i < 20; $i++) {
        //$stmt->execute(["name" => "Hello" . rand(1, 100), "data" => "World" . rand(1, 100)]);
        $sql .= ",('hello " . rand(1, 100) . "', 'world" . rand(1, 100) . "')";
    }
    $sql .= ";";
    $stmt = $conn->query($sql);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}

echo "<br />End time " . round(microtime(true));