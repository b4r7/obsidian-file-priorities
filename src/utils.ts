import { TAbstractFile, TFile, TFolder, setIcon, PathVirtualElement, TagCache } from "obsidian";
import wcmatch from "wildcard-match";

import { PathFilter, TagFilter, ItemAction, FileExplorerPlusPluginSettings } from "./settings";

export function changeVirtualElement(vEl: PathVirtualElement, enabled: boolean, settings: FileExplorerPlusPluginSettings, actionType: ItemAction) {
	// console.log(settings);

	let el = vEl.el;

	let usePrefix = false;
	let prefixString = '';
	
	let classNameParent = "";
	let classNamePrefix = ""

	
	// let classNamesPrefix: string[] = [];

	if (actionType == ItemAction.PIN) {
		usePrefix = settings.useCustomPinChar;
		prefixString = settings.customPinChar;

		classNameParent = "tree-item-pinned";
		classNamePrefix = "pin-prefix";
	}

	if (actionType == ItemAction.MUTE) {
		usePrefix = settings.useCustomMuteChar;
		prefixString = settings.customMuteChar;

		classNameParent = "tree-item-muted";
		classNamePrefix = "mute-prefix";
	}

	//Remove all previous mentions, fails silently when not present.
	el.removeClass(classNameParent);
	const prefixes = Array.from((vEl.el.firstChild as HTMLElement).children).filter((el: HTMLElement) => el.hasClass(classNamePrefix));
	prefixes.forEach((icon: HTMLElement) => vEl.el.firstChild?.removeChild(icon));
	
	//Add new element

	if (enabled && !el.hasClass(classNameParent)) {
        vEl.el.addClass(classNameParent);

		if (usePrefix && prefixString !== '') {
			

			const prefixDiv = document.createElement("div");
			const prefixDivText = document.createTextNode(prefixString);
			prefixDiv.appendChild(prefixDivText);
			
			prefixDiv.addClass("file-explorer-plus");
			prefixDiv.addClass(classNamePrefix);

			

			//prefixDiv.innerHTML = prefixString;				
				
			vEl.el.firstChild?.insertBefore(prefixDiv, vEl.el.firstChild.firstChild);	        
		} 
    } 

	return vEl;
}


export function checkPathFilter(filter: PathFilter, file: TAbstractFile): boolean {
    if (!filter.active || filter.pattern === "") {
        return false;
    }

    if (filter.type == "FILES" && file instanceof TFolder) {
        // Filter is only for files. Current row is a directory
        return false;
    }

    if (filter.type == "DIRECTORIES" && file instanceof TFile) {
        // Filter is only for directories. Current row is a file
        return false;
    }

    if (filter.patternType === "REGEX") {
        const re = new RegExp(filter.pattern);

        if (re.test(file.path) || re.test(file.path.replace(/.md$/g, "")) || re.test((file as TFile).basename || file.name)) {
            return true;
        }
    } else if (filter.patternType === "WILDCARD") {
        const isMatch = wcmatch(filter.pattern);

        if (isMatch(file.path) || isMatch(file.path.replace(/.md$/g, "")) || isMatch((file as TFile).basename || file.name)) {
            return true;
        }
    } else {
        if (
            file.path === filter.pattern ||
            file.path.replace(/.md$/g, "") == filter.pattern ||
            ((file as TFile).basename || file.name) === filter.pattern
        )
            return true;
    }

    return false;
}

// TODO: Fix tag filters when 1.4 arrives
export function checkTagFilter(filter: TagFilter, file: TAbstractFile): boolean {
    if (file instanceof TFolder) {
        return false;
    }

    if (!filter.active || filter.pattern === "") {
        return false;
    }

    const cachedMetadata = this.app.metadataCache.getFileCache(file as TFile);
    if (!cachedMetadata) {
        return false;
    }

    const tags = (cachedMetadata.tags || []).map((tag: TagCache) => tag.tag.replace(/^#/, ""));
    const frontmatterTags = cachedMetadata.frontmatter?.tags || [];

    const allTags = [...new Set(tags.concat(frontmatterTags))];

    if (filter.patternType === "REGEX") {
        const re = new RegExp(filter.pattern);

        return allTags.some((tag: string) => {
            if (re.test(tag)) {
                return true;
            }

            return false;
        });
    } else if (filter.patternType === "WILDCARD") {
        const isMatch = wcmatch(filter.pattern);

        return allTags.some((tag: string) => {
            if (isMatch(tag)) {
                return true;
            }

            return false;
        });
    } else if (filter.patternType === "STRICT") {
        return allTags.some((tag: string) => {
            if (tag === filter.pattern) {
                return true;
            }

            return false;
        });
    }

    return false;
}
