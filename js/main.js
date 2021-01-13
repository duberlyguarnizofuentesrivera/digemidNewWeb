$(function () {
    //const table_modal = new bootstrap.Modal($('#table_results_modal'));
    function titleCase(str) {
        return str.replace(
            /\w\S*/g,
            function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }

    const suggestion_list = $("#suggestions_list");
    $("#search_box").on("paste keyup", function () {
        const text = $(this).val();
        if (this.value.length < 3) {
            suggestion_list.empty();
            suggestion_list.append("<li>Ingresa un medicamento...</li>");
        } else {
            const search_results = request(text)
                .then(result => result.json())
                .then(element => processResults(element));
        }
    });

    const request = async (text) => {
        //console.log("making request");
        const response = await fetch("https://cors-anywhere.herokuapp.com/http://observatorio.digemid.minsa.gob.pe/default.aspx/GetMedicamentos", {
            headers: {
                "Content-Type": " application/json"
            },
            body: JSON.stringify({"term": text}),
            method: "POST"
        });
        if (!response.ok)
            throw new Error("Error with request", response.status);
        //const data = await response.json();
        return response;
    }


    function processResults(element) {
        //console.log("processing results");
        let number_of_elements = 0;
        suggestion_list.empty();
        for (let el in element.d) {
            number_of_elements = number_of_elements + 1;
            const listado_palabras_clave = ["Solucion", "Tableta", "Inyectable", "Crema"];
            let product_complete_name = element.d[el].value;
            let id_complete_string = element.d[el].id;
            let product_array = [product_complete_name, "(Sin Descripción)"];
            for (let keyword in listado_palabras_clave) {
                let keyword_found = product_complete_name.indexOf(listado_palabras_clave[keyword]);
                if (keyword_found !== -1) {
                    product_array = [product_complete_name.substring(0, keyword_found),
                        product_complete_name.substring(keyword_found)];
                }
            }
            //console.log(product_array)

            const product_name = product_array[0];
            const product_type = product_array[1];

            if (number_of_elements < 6) {
                suggestion_list.append("<li data-id=\"" + id_complete_string + "\"><a href=\"#\">" + product_name + "<br/><span>" + product_type + "</span></a></li>");
            }
            //console.log(product_complete_name)
        }
    }

    async function getTableData(url) {
        console.log("getTableData Initialized")
        const response = await fetch(url, {
            headers: {
                "Content-Type": " application/json"
            },
            method: "GET"
        }).then(result => result.json()).then(data => populateTable(data));
    }

    function populateTable(list) {
        console.log("populateTable started")
        console.log(list)
        //todo: poner fecha de actualización natural (hace 3 dias, etc)
        for (let element in list.aaData) {
            let el = list.aaData[element]
            $("tbody").append("<tr><td>" + titleCase(el[1]) + "</td><td>" + el[2].split(" ")[0] + "</td><td>" + el[3] + "</td><td>" + titleCase(el[4]) + "</td><td>" + titleCase(el[6]) + "</td><td>" + el[7] + "</td><td>Detalle</td></tr>")
        }
        //table_modal.show();
    }

    $("ul").on("mousedown", "a", function (event) {
        event.stopPropagation();
        let texto = $(this).text();
        let id_string = $(this).parent().attr("data-id");
        //console.log(id_string)
        //todo: Considerar que DIGEMID bota server error si el primer valor no está presente... debes manejar ese error!
        let id_array = id_string.split("@");
        for (let el in id_array) {
            id_array[el] = id_array[el].replace(/ /g, "*");
        }
        //console.log(id_array);
        $("#search_box").val(texto);
        let encoded_text = texto.replace(/ /g, "*");
        //console.log(encoded_text)
        let url = "https://cors-anywhere.herokuapp.com/http://observatorio.digemid.minsa.gob.pe/Precios/ProcesoL/Consulta/data.aspx?grupo=" + id_array[0] + "&tipo_busqueda=3&totalPA=" + id_array[1] + "&relacionado=1&con=" + id_array[2] + "&ffs=" + id_array[3] + "&ubigeo=04&cad=" + encoded_text + "&_=1610425495843&sEcho=1&iColumns=9&sColumns=&iDisplayStart=0&iDisplayLength=150&sSearch=&bRegex=false&sSearch_0=&bRegex_0=false&bSearchable_0=true&sSearch_1=&bRegex_1=false&bSearchable_1=true&sSearch_2=&bRegex_2=false&bSearchable_2=true&sSearch_3=&bRegex_3=false&bSearchable_3=true&sSearch_4=&bRegex_4=false&bSearchable_4=true&sSearch_5=&bRegex_5=false&bSearchable_5=true&sSearch_6=&bRegex_6=false&bSearchable_6=true&sSearch_7=&bRegex_7=false&bSearchable_7=true&sSearch_8=&bRegex_8=false&bSearchable_8=true&iSortingCols=0&bSortable_0=false&bSortable_1=false&bSortable_2=false&bSortable_3=false&bSortable_4=false&bSortable_5=false&bSortable_6=false&bSortable_7=false&bSortable_8=true";
        console.log("starting getTableData()")
        getTableData(url);
    });
});
