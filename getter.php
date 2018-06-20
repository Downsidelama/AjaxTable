<?php
include('config.php');

try {
    $conn = new PDO("mysql:host=$servername;dbname=admin_playground", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = null;

    $search = "%";
    if (isset($_GET['search'])) {
        $search = "%" . $_GET['search'] . "%";
    }

    $getRowNums = $conn->prepare("SELECT COUNT(*) FROM `test` WHERE `name` LIKE :search OR `data` LIKE :search");
    $getRowNums->bindParam(":search", $search, PDO::PARAM_STR);
    $getRowNums->execute();
    $rowNums = $getRowNums->fetch(PDO::FETCH_NUM)[0];
    $getRowNums = null;

    $limit = 10;
    if (isset($_GET['limit']) && is_numeric($_GET['limit'])) {
        $limit = $_GET['limit'];
        if ($limit < 10 || $limit > 500) {
            $limit = 10;
        }
    }

    $pageNum = ceil($rowNums / $limit);
    if($pageNum < 1) {
        $pageNum = 1;
    }
    $currentPage = 1;
    if(isset($_GET['page']) && is_numeric($_GET['page'])) {
        $currentPage = $_GET['page'];
        if($currentPage < 1 || $currentPage > $pageNum) {
            $currentPage = 1;
        }
    }

    $offset = $limit * ($currentPage - 1);


    if (!isset($_GET['newRow'])) {
        $stmt = $conn->prepare("SELECT * FROM `test` WHERE `name` LIKE :search OR `data` LIKE :search ORDER BY `id` DESC LIMIT :limit OFFSET :offset");
    } else {
        $stmt = $conn->prepare("SELECT * FROM `test` WHERE `seen`=0 AND (`name` LIKE :search OR `data` LIKE :search) ORDER BY `id` DESC LIMIT :limit OFFSET :offset");
    }

    $array = array();
    $array['page'] = $pageNum;
    $array['currentPage'] = $currentPage;
    $array['status'] = 'OK';
    $array['data'] = array();


    $stmt->bindParam(":search", $search, PDO::PARAM_STR);
    $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
    $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
    if ($stmt->execute()) {
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $array['data'][] = $row;
        }
    } else {
        $array['status'] = 'ERROR';
        $array['errorMsg'] = 'DATABASE ERROR: ' . $conn->errorCode();
    }
    $array['dataCount'] = count($array['data']);
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