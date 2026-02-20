using System;
using System.Collections.Generic;
using System.Linq;
using Autodesk.Revit.DB;
using Autodesk.Revit.DB.Architecture;
using Autodesk.Revit.UI;
using Newtonsoft.Json.Linq;

namespace RevitMCPPlugin.Core
{
    /// <summary>
    /// Routes MCP commands to their corresponding Revit API implementations.
    /// This is the main command dispatcher for all 55 tools.
    /// </summary>
    public static class CommandExecutor
    {
        public static JToken Execute(UIApplication uiApp, string command, JObject parameters)
        {
            var doc = uiApp.ActiveUIDocument?.Document;
            var uidoc = uiApp.ActiveUIDocument;

            if (doc == null)
                throw new InvalidOperationException("No active document. Please open a Revit project first.");

            switch (command)
            {
                // ===== READING COMMANDS =====
                case "get_current_view_info":
                    return GetCurrentViewInfo(uidoc!);
                case "get_current_view_elements":
                    return GetCurrentViewElements(uidoc!, parameters);
                case "get_selected_elements":
                    return GetSelectedElements(uidoc!);
                case "get_elements":
                    return GetElements(doc, parameters);
                case "get_parameters":
                    return GetParameters(doc, parameters);
                case "get_project_info":
                    return GetProjectInfo(doc);
                case "get_views":
                    return GetViews(doc, parameters);
                case "get_sheets":
                    return GetSheets(doc);
                case "get_levels":
                    return GetLevels(doc);
                case "get_grids":
                    return GetGrids(doc);
                case "get_rooms":
                    return GetRooms(doc);
                case "get_available_family_types":
                    return GetFamilyTypes(doc, parameters);
                case "get_schedules":
                    return GetSchedules(doc);
                case "get_linked_models":
                    return GetLinkedModels(doc);
                case "get_warnings":
                    return GetWarnings(doc);

                // ===== CREATING COMMANDS =====
                case "create_wall":
                    return CreateWall(doc, parameters);
                case "create_level":
                    return CreateLevel(doc, parameters);
                case "create_grid":
                    return CreateGrid(doc, parameters);
                case "create_room":
                    return CreateRoom(doc, parameters);
                case "create_sheet":
                    return CreateSheet(doc, parameters);
                case "create_point_based_element":
                case "create_line_based_element":
                case "create_floor":
                case "create_ceiling":
                case "create_roof":
                case "create_view":
                case "create_schedule":
                case "create_tag":
                case "create_dimension":
                case "create_text_note":
                    return ExecuteGenericCommand(doc, command, parameters);

                // ===== EDITING COMMANDS =====
                case "modify_element":
                    return ModifyElement(doc, parameters);
                case "move_element":
                    return MoveElement(doc, parameters);
                case "delete_elements":
                    return DeleteElements(doc, parameters);
                case "copy_element":
                case "rotate_element":
                case "mirror_element":
                case "align_elements":
                case "group_elements":
                case "change_type":
                case "set_workset":
                case "color_elements":
                case "batch_modify_parameters":
                    return ExecuteGenericCommand(doc, command, parameters);

                // ===== DOCUMENTATION COMMANDS =====
                case "place_view_on_sheet":
                case "create_viewport":
                case "export_schedule":
                case "create_legend":
                case "add_revision":
                case "print_sheets":
                case "export_dwg":
                case "tag_all_in_view":
                    return ExecuteGenericCommand(doc, command, parameters);

                // ===== QA/QC COMMANDS =====
                case "check_warnings":
                    return GetWarnings(doc);
                case "audit_model":
                    return AuditModel(doc);
                case "check_room_compliance":
                case "check_naming_conventions":
                case "find_duplicates":
                case "purge_unused":
                case "check_links_status":
                case "validate_parameters":
                    return ExecuteGenericCommand(doc, command, parameters);

                // ===== ADVANCED COMMANDS =====
                case "send_code_to_revit":
                    return new JObject { ["message"] = "Code execution is handled by the command set module" };
                case "select_elements":
                    return SelectElements(uidoc!, parameters);
                case "get_model_statistics":
                    return GetModelStatistics(doc);
                case "ai_element_filter":
                case "reset_view":
                    return ExecuteGenericCommand(doc, command, parameters);

                default:
                    throw new InvalidOperationException($"Unknown command: {command}");
            }
        }

        // ===== READING IMPLEMENTATIONS =====

        private static JToken GetCurrentViewInfo(UIDocument uidoc)
        {
            var view = uidoc.ActiveView;
            return new JObject
            {
                ["viewId"] = view.Id.IntegerValue,
                ["viewName"] = view.Name,
                ["viewType"] = view.ViewType.ToString(),
                ["scale"] = view.Scale,
                ["levelName"] = view.GenLevel?.Name ?? "N/A",
                ["isTemplate"] = view.IsTemplate
            };
        }

        private static JToken GetCurrentViewElements(UIDocument uidoc, JObject parameters)
        {
            var collector = new FilteredElementCollector(uidoc.Document, uidoc.ActiveView.Id);
            var category = parameters["category"]?.ToString();

            if (!string.IsNullOrEmpty(category))
            {
                var builtInCat = GetBuiltInCategory(category);
                if (builtInCat != BuiltInCategory.INVALID)
                    collector = collector.OfCategory(builtInCat);
            }

            var elements = collector.WhereElementIsNotElementType().ToElements();
            var result = new JArray();

            foreach (var elem in elements)
            {
                result.Add(new JObject
                {
                    ["id"] = elem.Id.IntegerValue,
                    ["name"] = elem.Name,
                    ["category"] = elem.Category?.Name ?? "Unknown"
                });
            }

            return new JObject { ["elements"] = result, ["count"] = result.Count };
        }

        private static JToken GetSelectedElements(UIDocument uidoc)
        {
            var selected = uidoc.Selection.GetElementIds();
            var result = new JArray();

            foreach (var id in selected)
            {
                var elem = uidoc.Document.GetElement(id);
                if (elem != null)
                {
                    var elemObj = new JObject
                    {
                        ["id"] = elem.Id.IntegerValue,
                        ["name"] = elem.Name,
                        ["category"] = elem.Category?.Name ?? "Unknown"
                    };

                    // Include key parameters
                    var paramsObj = new JObject();
                    foreach (Parameter p in elem.Parameters)
                    {
                        if (p.HasValue)
                        {
                            paramsObj[p.Definition.Name] = p.AsValueString() ?? p.AsString() ?? "";
                        }
                    }
                    elemObj["parameters"] = paramsObj;
                    result.Add(elemObj);
                }
            }

            return new JObject { ["elements"] = result, ["count"] = result.Count };
        }

        private static JToken GetElements(Document doc, JObject parameters)
        {
            var category = parameters["category"]?.ToString() ?? "";
            var includeParams = parameters["includeParameters"]?.Value<bool>() ?? false;

            var collector = new FilteredElementCollector(doc);
            var builtInCat = GetBuiltInCategory(category);

            if (builtInCat != BuiltInCategory.INVALID)
                collector = collector.OfCategory(builtInCat);

            var elements = collector.WhereElementIsNotElementType().ToElements();
            var result = new JArray();

            foreach (var elem in elements.Take(500)) // Limit to 500 to avoid memory issues
            {
                var obj = new JObject
                {
                    ["id"] = elem.Id.IntegerValue,
                    ["name"] = elem.Name,
                    ["category"] = elem.Category?.Name ?? "Unknown"
                };

                if (includeParams)
                {
                    var paramsObj = new JObject();
                    foreach (Parameter p in elem.Parameters)
                    {
                        if (p.HasValue)
                            paramsObj[p.Definition.Name] = p.AsValueString() ?? p.AsString() ?? "";
                    }
                    obj["parameters"] = paramsObj;
                }

                result.Add(obj);
            }

            return new JObject { ["elements"] = result, ["count"] = result.Count };
        }

        private static JToken GetParameters(Document doc, JObject parameters)
        {
            var elementId = parameters["elementId"]?.Value<int>() ?? 0;
            var elem = doc.GetElement(new ElementId(elementId));

            if (elem == null)
                throw new InvalidOperationException($"Element {elementId} not found");

            var result = new JObject();
            var instanceParams = new JObject();
            var typeParams = new JObject();

            foreach (Parameter p in elem.Parameters)
            {
                if (p.HasValue)
                    instanceParams[p.Definition.Name] = p.AsValueString() ?? p.AsString() ?? "";
            }

            var typeElem = doc.GetElement(elem.GetTypeId());
            if (typeElem != null)
            {
                foreach (Parameter p in typeElem.Parameters)
                {
                    if (p.HasValue)
                        typeParams[p.Definition.Name] = p.AsValueString() ?? p.AsString() ?? "";
                }
            }

            result["elementId"] = elementId;
            result["name"] = elem.Name;
            result["category"] = elem.Category?.Name ?? "Unknown";
            result["instanceParameters"] = instanceParams;
            result["typeParameters"] = typeParams;

            return result;
        }

        private static JToken GetProjectInfo(Document doc)
        {
            var info = doc.ProjectInformation;
            return new JObject
            {
                ["projectName"] = info.Name,
                ["projectNumber"] = info.Number,
                ["clientName"] = info.ClientName,
                ["buildingName"] = info.BuildingName,
                ["address"] = info.Address,
                ["status"] = info.Status,
                ["issueDate"] = info.IssueDate,
                ["filePath"] = doc.PathName
            };
        }

        private static JToken GetViews(Document doc, JObject parameters)
        {
            var viewTypeFilter = parameters["viewType"]?.ToString() ?? "";
            var collector = new FilteredElementCollector(doc).OfClass(typeof(View));
            var result = new JArray();

            foreach (View view in collector)
            {
                if (view.IsTemplate) continue;
                if (!string.IsNullOrEmpty(viewTypeFilter) &&
                    !view.ViewType.ToString().Equals(viewTypeFilter, StringComparison.OrdinalIgnoreCase))
                    continue;

                result.Add(new JObject
                {
                    ["id"] = view.Id.IntegerValue,
                    ["name"] = view.Name,
                    ["viewType"] = view.ViewType.ToString(),
                    ["scale"] = view.Scale
                });
            }

            return new JObject { ["views"] = result, ["count"] = result.Count };
        }

        private static JToken GetSheets(Document doc)
        {
            var collector = new FilteredElementCollector(doc).OfClass(typeof(ViewSheet));
            var result = new JArray();

            foreach (ViewSheet sheet in collector)
            {
                var viewIds = sheet.GetAllPlacedViews();
                var views = new JArray();
                foreach (var vid in viewIds)
                {
                    var v = doc.GetElement(vid) as View;
                    if (v != null) views.Add(v.Name);
                }

                result.Add(new JObject
                {
                    ["id"] = sheet.Id.IntegerValue,
                    ["number"] = sheet.SheetNumber,
                    ["name"] = sheet.Name,
                    ["placedViews"] = views
                });
            }

            return new JObject { ["sheets"] = result, ["count"] = result.Count };
        }

        private static JToken GetLevels(Document doc)
        {
            var collector = new FilteredElementCollector(doc).OfClass(typeof(Level));
            var result = new JArray();

            foreach (Level level in collector)
            {
                result.Add(new JObject
                {
                    ["id"] = level.Id.IntegerValue,
                    ["name"] = level.Name,
                    ["elevation"] = Math.Round(level.Elevation, 4)
                });
            }

            return new JObject { ["levels"] = result, ["count"] = result.Count };
        }

        private static JToken GetGrids(Document doc)
        {
            var collector = new FilteredElementCollector(doc).OfClass(typeof(Grid));
            var result = new JArray();

            foreach (Grid grid in collector)
            {
                var curve = grid.Curve;
                result.Add(new JObject
                {
                    ["id"] = grid.Id.IntegerValue,
                    ["name"] = grid.Name,
                    ["isCurved"] = !(curve is Line)
                });
            }

            return new JObject { ["grids"] = result, ["count"] = result.Count };
        }

        private static JToken GetRooms(Document doc)
        {
            var collector = new FilteredElementCollector(doc).OfCategory(BuiltInCategory.OST_Rooms);
            var result = new JArray();

            foreach (var elem in collector)
            {
                if (elem is Room room)
                {
                    result.Add(new JObject
                    {
                        ["id"] = room.Id.IntegerValue,
                        ["name"] = room.get_Parameter(BuiltInParameter.ROOM_NAME)?.AsString() ?? "",
                        ["number"] = room.get_Parameter(BuiltInParameter.ROOM_NUMBER)?.AsString() ?? "",
                        ["area"] = Math.Round(room.Area, 2),
                        ["level"] = room.Level?.Name ?? "N/A"
                    });
                }
            }

            return new JObject { ["rooms"] = result, ["count"] = result.Count };
        }

        private static JToken GetFamilyTypes(Document doc, JObject parameters)
        {
            var category = parameters["category"]?.ToString() ?? "";
            var collector = new FilteredElementCollector(doc).OfClass(typeof(FamilySymbol));

            if (!string.IsNullOrEmpty(category))
            {
                var builtInCat = GetBuiltInCategory(category);
                if (builtInCat != BuiltInCategory.INVALID)
                    collector = collector.OfCategory(builtInCat);
            }

            var result = new JArray();
            foreach (FamilySymbol symbol in collector)
            {
                result.Add(new JObject
                {
                    ["id"] = symbol.Id.IntegerValue,
                    ["familyName"] = symbol.FamilyName,
                    ["typeName"] = symbol.Name,
                    ["category"] = symbol.Category?.Name ?? ""
                });
            }

            return new JObject { ["familyTypes"] = result, ["count"] = result.Count };
        }

        private static JToken GetSchedules(Document doc)
        {
            var collector = new FilteredElementCollector(doc).OfClass(typeof(ViewSchedule));
            var result = new JArray();

            foreach (ViewSchedule schedule in collector)
            {
                if (schedule.IsTitleblockRevisionSchedule) continue;

                result.Add(new JObject
                {
                    ["id"] = schedule.Id.IntegerValue,
                    ["name"] = schedule.Name
                });
            }

            return new JObject { ["schedules"] = result, ["count"] = result.Count };
        }

        private static JToken GetLinkedModels(Document doc)
        {
            var collector = new FilteredElementCollector(doc).OfClass(typeof(RevitLinkType));
            var result = new JArray();

            foreach (RevitLinkType linkType in collector)
            {
                result.Add(new JObject
                {
                    ["id"] = linkType.Id.IntegerValue,
                    ["name"] = linkType.Name
                });
            }

            return new JObject { ["linkedModels"] = result, ["count"] = result.Count };
        }

        private static JToken GetWarnings(Document doc)
        {
            var warnings = doc.GetWarnings();
            var result = new JArray();

            foreach (var warning in warnings)
            {
                var elementIds = warning.GetFailingElements().Select(id => id.IntegerValue).ToList();
                result.Add(new JObject
                {
                    ["description"] = warning.GetDescriptionText(),
                    ["severity"] = warning.GetSeverity().ToString(),
                    ["elementIds"] = new JArray(elementIds)
                });
            }

            return new JObject { ["warnings"] = result, ["count"] = result.Count };
        }

        // ===== CREATING IMPLEMENTATIONS =====

        private static JToken CreateWall(Document doc, JObject parameters)
        {
            using (var tx = new Transaction(doc, "Create Wall"))
            {
                tx.Start();
                try
                {
                    var startX = parameters["startX"]?.Value<double>() ?? 0;
                    var startY = parameters["startY"]?.Value<double>() ?? 0;
                    var endX = parameters["endX"]?.Value<double>() ?? 0;
                    var endY = parameters["endY"]?.Value<double>() ?? 0;
                    var levelName = parameters["levelName"]?.ToString() ?? "";
                    var height = parameters["height"]?.Value<double>() ?? 10;

                    var level = new FilteredElementCollector(doc)
                        .OfClass(typeof(Level))
                        .Cast<Level>()
                        .FirstOrDefault(l => l.Name.Equals(levelName, StringComparison.OrdinalIgnoreCase));

                    if (level == null)
                        throw new InvalidOperationException($"Level '{levelName}' not found");

                    var start = new XYZ(startX, startY, 0);
                    var end = new XYZ(endX, endY, 0);
                    if (start.DistanceTo(end) < 0.001)
                        throw new InvalidOperationException("Wall start and end points are too close (must be > 0.001 ft apart)");

                    var line = Line.CreateBound(start, end);
                    var wall = Wall.Create(doc, line, level.Id, false);
                    wall.get_Parameter(BuiltInParameter.WALL_USER_HEIGHT_PARAM)?.Set(height);

                    tx.Commit();
                    return new JObject
                    {
                        ["elementId"] = wall.Id.IntegerValue,
                        ["message"] = $"Wall created successfully on level '{levelName}'"
                    };
                }
                catch
                {
                    if (tx.HasStarted() && !tx.HasEnded()) tx.RollBack();
                    throw;
                }
            }
        }

        private static JToken CreateLevel(Document doc, JObject parameters)
        {
            using (var tx = new Transaction(doc, "Create Level"))
            {
                tx.Start();
                try
                {
                    var name = parameters["name"]?.ToString() ?? "New Level";
                    var elevation = parameters["elevation"]?.Value<double>() ?? 0;

                    // Check for duplicate level name
                    var existing = new FilteredElementCollector(doc)
                        .OfClass(typeof(Level))
                        .Cast<Level>()
                        .FirstOrDefault(l => l.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
                    if (existing != null)
                        throw new InvalidOperationException($"Level '{name}' already exists (id: {existing.Id.IntegerValue})");

                    var level = Level.Create(doc, elevation);
                    level.Name = name;

                    tx.Commit();
                    return new JObject
                    {
                        ["elementId"] = level.Id.IntegerValue,
                        ["message"] = $"Level '{name}' created at elevation {elevation}"
                    };
                }
                catch
                {
                    if (tx.HasStarted() && !tx.HasEnded()) tx.RollBack();
                    throw;
                }
            }
        }

        private static JToken CreateGrid(Document doc, JObject parameters)
        {
            using (var tx = new Transaction(doc, "Create Grid"))
            {
                tx.Start();
                try
                {
                    var startX = parameters["startX"]?.Value<double>() ?? 0;
                    var startY = parameters["startY"]?.Value<double>() ?? 0;
                    var endX = parameters["endX"]?.Value<double>() ?? 0;
                    var endY = parameters["endY"]?.Value<double>() ?? 0;
                    var name = parameters["name"]?.ToString() ?? "";

                    var start = new XYZ(startX, startY, 0);
                    var end = new XYZ(endX, endY, 0);
                    if (start.DistanceTo(end) < 0.001)
                        throw new InvalidOperationException("Grid start and end points are too close");

                    var line = Line.CreateBound(start, end);
                    var grid = Grid.Create(doc, line);

                    if (!string.IsNullOrEmpty(name))
                        grid.Name = name;

                    tx.Commit();
                    return new JObject
                    {
                        ["elementId"] = grid.Id.IntegerValue,
                        ["message"] = $"Grid '{grid.Name}' created"
                    };
                }
                catch
                {
                    if (tx.HasStarted() && !tx.HasEnded()) tx.RollBack();
                    throw;
                }
            }
        }

        private static JToken CreateRoom(Document doc, JObject parameters)
        {
            using (var tx = new Transaction(doc, "Create Room"))
            {
                tx.Start();
                try
                {
                    var x = parameters["x"]?.Value<double>() ?? 0;
                    var y = parameters["y"]?.Value<double>() ?? 0;
                    var levelName = parameters["levelName"]?.ToString() ?? "";

                    var level = new FilteredElementCollector(doc)
                        .OfClass(typeof(Level))
                        .Cast<Level>()
                        .FirstOrDefault(l => l.Name.Equals(levelName, StringComparison.OrdinalIgnoreCase));

                    if (level == null)
                        throw new InvalidOperationException($"Level '{levelName}' not found");

                    var room = doc.Create.NewRoom(level, new UV(x, y));

                    var roomName = parameters["roomName"]?.ToString();
                    if (!string.IsNullOrEmpty(roomName))
                        room.get_Parameter(BuiltInParameter.ROOM_NAME)?.Set(roomName);

                    var roomNumber = parameters["roomNumber"]?.ToString();
                    if (!string.IsNullOrEmpty(roomNumber))
                        room.get_Parameter(BuiltInParameter.ROOM_NUMBER)?.Set(roomNumber);

                    tx.Commit();
                    return new JObject
                    {
                        ["elementId"] = room.Id.IntegerValue,
                        ["message"] = $"Room created on level '{levelName}'"
                    };
                }
                catch
                {
                    if (tx.HasStarted() && !tx.HasEnded()) tx.RollBack();
                    throw;
                }
            }
        }

        private static JToken CreateSheet(Document doc, JObject parameters)
        {
            using (var tx = new Transaction(doc, "Create Sheet"))
            {
                tx.Start();
                try
                {
                    var titleBlockId = ElementId.InvalidElementId;
                    var titleBlockName = parameters["titleBlockName"]?.ToString();

                    if (!string.IsNullOrEmpty(titleBlockName))
                    {
                        var tb = new FilteredElementCollector(doc)
                            .OfClass(typeof(FamilySymbol))
                            .OfCategory(BuiltInCategory.OST_TitleBlocks)
                            .Cast<FamilySymbol>()
                            .FirstOrDefault(s => s.Name.IndexOf(titleBlockName, StringComparison.OrdinalIgnoreCase) >= 0);

                        if (tb != null) titleBlockId = tb.Id;
                    }
                    else
                    {
                        var tb = new FilteredElementCollector(doc)
                            .OfClass(typeof(FamilySymbol))
                            .OfCategory(BuiltInCategory.OST_TitleBlocks)
                            .FirstOrDefault();
                        if (tb != null) titleBlockId = tb.Id;
                    }

                    var sheet = ViewSheet.Create(doc, titleBlockId);
                    sheet.SheetNumber = parameters["sheetNumber"]?.ToString() ?? "NEW";
                    sheet.Name = parameters["sheetName"]?.ToString() ?? "New Sheet";

                    tx.Commit();
                    return new JObject
                    {
                        ["elementId"] = sheet.Id.IntegerValue,
                        ["message"] = $"Sheet '{sheet.SheetNumber} - {sheet.Name}' created"
                    };
                }
                catch
                {
                    if (tx.HasStarted() && !tx.HasEnded()) tx.RollBack();
                    throw;
                }
            }
        }

        // ===== EDITING IMPLEMENTATIONS =====

        private static JToken ModifyElement(Document doc, JObject parameters)
        {
            using (var tx = new Transaction(doc, "Modify Element"))
            {
                tx.Start();
                try
                {
                    var elementId = parameters["elementId"]?.Value<int>() ?? 0;
                    var elem = doc.GetElement(new ElementId(elementId));
                    if (elem == null)
                        throw new InvalidOperationException($"Element {elementId} not found");

                    var modifications = parameters["modifications"] as JArray;
                    int modCount = 0;
                    if (modifications != null)
                    {
                        foreach (JObject mod in modifications)
                        {
                            var paramName = mod["parameterName"]?.ToString() ?? "";
                            var value = mod["value"];

                            foreach (Parameter p in elem.Parameters)
                            {
                                if (p.Definition.Name == paramName && !p.IsReadOnly)
                                {
                                    if (value?.Type == JTokenType.String)
                                        p.Set(value.ToString());
                                    else if (value?.Type == JTokenType.Integer || value?.Type == JTokenType.Float)
                                        p.Set(value.Value<double>());
                                    modCount++;
                                    break;
                                }
                            }
                        }
                    }

                    tx.Commit();
                    return new JObject { ["message"] = $"Element {elementId} modified ({modCount} parameters updated)" };
                }
                catch
                {
                    if (tx.HasStarted() && !tx.HasEnded()) tx.RollBack();
                    throw;
                }
            }
        }

        private static JToken MoveElement(Document doc, JObject parameters)
        {
            using (var tx = new Transaction(doc, "Move Element"))
            {
                tx.Start();
                try
                {
                    var elementId = parameters["elementId"]?.Value<int>() ?? 0;
                    var dx = parameters["deltaX"]?.Value<double>() ?? 0;
                    var dy = parameters["deltaY"]?.Value<double>() ?? 0;
                    var dz = parameters["deltaZ"]?.Value<double>() ?? 0;

                    var elem = doc.GetElement(new ElementId(elementId));
                    if (elem == null)
                        throw new InvalidOperationException($"Element {elementId} not found");

                    var translation = new XYZ(dx, dy, dz);
                    if (translation.GetLength() < 1e-9)
                        throw new InvalidOperationException("Move delta is zero — nothing to move");

                    ElementTransformUtils.MoveElement(doc, elem.Id, translation);
                    tx.Commit();
                    return new JObject { ["message"] = $"Element {elementId} moved by ({dx}, {dy}, {dz})" };
                }
                catch
                {
                    if (tx.HasStarted() && !tx.HasEnded()) tx.RollBack();
                    throw;
                }
            }
        }

        private static JToken DeleteElements(Document doc, JObject parameters)
        {
            using (var tx = new Transaction(doc, "Delete Elements"))
            {
                tx.Start();
                try
                {
                    var ids = (parameters["elementIds"] as JArray)?
                        .Select(id => new ElementId(id.Value<int>()))
                        .ToList() ?? new List<ElementId>();

                    if (ids.Count == 0)
                        throw new InvalidOperationException("No element IDs provided for deletion");

                    // Validate all elements exist before deleting
                    foreach (var id in ids)
                    {
                        if (doc.GetElement(id) == null)
                            throw new InvalidOperationException($"Element {id.IntegerValue} not found");
                    }

                    // doc.Delete accepts ICollection<ElementId>
                    doc.Delete(ids as ICollection<ElementId>);
                    tx.Commit();
                    return new JObject { ["message"] = $"{ids.Count} elements deleted successfully" };
                }
                catch
                {
                    if (tx.HasStarted() && !tx.HasEnded()) tx.RollBack();
                    throw;
                }
            }
        }

        private static JToken SelectElements(UIDocument uidoc, JObject parameters)
        {
            var ids = (parameters["elementIds"] as JArray)?
                .Select(id => new ElementId(id.Value<int>()))
                .ToList() ?? new List<ElementId>();

            uidoc.Selection.SetElementIds(ids);

            return new JObject { ["message"] = $"{ids.Count} elements selected" };
        }

        // ===== QA/QC IMPLEMENTATIONS =====

        private static JToken AuditModel(Document doc)
        {
            var result = new JObject();

            // Count elements by category
            var allElements = new FilteredElementCollector(doc).WhereElementIsNotElementType().ToElements();
            var categoryCounts = allElements
                .Where(e => e.Category != null)
                .GroupBy(e => e.Category.Name)
                .ToDictionary(g => g.Key, g => g.Count());

            result["totalElements"] = allElements.Count;
            result["categoryCounts"] = JObject.FromObject(categoryCounts);
            result["warningCount"] = doc.GetWarnings().Count();
            result["levelCount"] = new FilteredElementCollector(doc).OfClass(typeof(Level)).GetElementCount();
            result["sheetCount"] = new FilteredElementCollector(doc).OfClass(typeof(ViewSheet)).GetElementCount();
            result["viewCount"] = new FilteredElementCollector(doc).OfClass(typeof(View)).GetElementCount();

            return result;
        }

        private static JToken GetModelStatistics(Document doc)
        {
            return AuditModel(doc);
        }

        // ===== GENERIC COMMAND (for commands not yet fully implemented) =====

        private static JToken ExecuteGenericCommand(Document doc, string command, JObject parameters)
        {
            return new JObject
            {
                ["command"] = command,
                ["status"] = "received",
                ["message"] = $"Command '{command}' received. This command requires the extended command set module.",
                ["parameters"] = parameters
            };
        }

        // ===== HELPER METHODS =====

        private static BuiltInCategory GetBuiltInCategory(string categoryName)
        {
            var mapping = new Dictionary<string, BuiltInCategory>(StringComparer.OrdinalIgnoreCase)
            {
                ["Walls"] = BuiltInCategory.OST_Walls,
                ["Doors"] = BuiltInCategory.OST_Doors,
                ["Windows"] = BuiltInCategory.OST_Windows,
                ["Floors"] = BuiltInCategory.OST_Floors,
                ["Ceilings"] = BuiltInCategory.OST_Ceilings,
                ["Roofs"] = BuiltInCategory.OST_Roofs,
                ["Columns"] = BuiltInCategory.OST_Columns,
                ["Furniture"] = BuiltInCategory.OST_Furniture,
                ["Rooms"] = BuiltInCategory.OST_Rooms,
                ["Stairs"] = BuiltInCategory.OST_Stairs,
                ["Railings"] = BuiltInCategory.OST_StairsRailing,
                ["Grids"] = BuiltInCategory.OST_Grids,
                ["Levels"] = BuiltInCategory.OST_Levels,
                ["Pipes"] = BuiltInCategory.OST_PipeCurves,
                ["Ducts"] = BuiltInCategory.OST_DuctCurves,
                ["Electrical"] = BuiltInCategory.OST_ElectricalEquipment,
                ["Plumbing"] = BuiltInCategory.OST_PlumbingFixtures,
                ["Mechanical"] = BuiltInCategory.OST_MechanicalEquipment,
            };

            return mapping.TryGetValue(categoryName, out var cat) ? cat : BuiltInCategory.INVALID;
        }
    }
}
