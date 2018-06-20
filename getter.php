<?php

include('config.php');

try {
    $conn = new PDO("mysql:host=$servername;dbname=admin_playground", $username, $password);
    // set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    //echo "Connected successfully";
    $stmt = null;

    $search = "%";
    if (isset($_GET['search'])) {
        $search = "%" . $_GET['search'] . "%";
    }

    if (!isset($_GET['newRow'])) {
        $stmt = $conn->prepare("SELECT * FROM `test` WHERE `name` LIKE :search OR `data` LIKE :search ORDER BY `id` DESC LIMIT :limit OFFSET 10");
    } else {
        $stmt = $conn->prepare("SELECT * FROM `test` WHERE `seen`=0 AND (`name` LIKE :search OR `data` LIKE :search) ORDER BY `id` DESC LIMIT :limit");
    }

    $array = array();
    $array['status'] = 'OK';
    $array['data'] = array();

    $limit = 10;
    if (isset($_GET['limit']) && is_numeric($_GET['limit'])) {
        $limit = $_GET['limit'];
        if ($limit < 10 || $limit > 500) {
            $limit = 10;
        }
    }

    $stmt->bindParam(":search", $search, PDO::PARAM_STR);
    $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
    if ($stmt->execute()) {
        while ($row = $stmt->fetch()) {
            $array['data'][] = $row;
        }
    } else {
        $array['status'] = 'ERROR';
        $array['errorMsg'] = 'DATABASE ERROR: ' . $conn->errorCode();
    }
    $conn->query("UPDATE `test` SET `seen` = 1")->execute();
    echo json_encode($array);
} catch (PDOException $e) {
    $array = array();
    $array['status'] = "ERROR";
    $array['errorMsg'] = "DATABASE ERROR: " . $e->getMessage();
    echo json_encode($array);
} finally {
    $conn = null;
}
?>